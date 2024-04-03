/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CommandType, IUniverInstanceService } from '@univerjs/core';
import type { IMutation, IMutationCommonParams, Nullable, TextXAction } from '@univerjs/core';

import type { ITextRangeWithStyle } from '@univerjs/engine-render';
import { DocViewModelManagerService } from '../../services/doc-view-model-manager.service';
import { serializeTextRange, TextSelectionManagerService } from '../../services/text-selection-manager.service';
import type { IDocStateChangeParams } from '../../services/doc-state-change-manager.service';
import { DocStateChangeManagerService } from '../../services/doc-state-change-manager.service';
import { IMEInputManagerService } from '../../services/ime-input-manager.service';

export interface IRichTextEditingMutationParams extends IMutationCommonParams {
    unitId: string;
    actions: TextXAction[];
    textRanges: Nullable<ITextRangeWithStyle[]>;
    prevTextRanges?: Nullable<ITextRangeWithStyle[]>;
    noNeedSetTextRange?: boolean;
    noHistory?: boolean;
    isCompositionEnd?: boolean;
}

const RichTextEditingMutationId = 'doc.mutation.rich-text-editing';

/**
 * The core mutator to change rich text actions. The execution result would be undo mutation params. Could be directly
 * send to undo redo service (will be used by the triggering command).
 */
export const RichTextEditingMutation: IMutation<IRichTextEditingMutationParams, IRichTextEditingMutationParams> = {
    id: RichTextEditingMutationId,

    type: CommandType.MUTATION,

    handler: (accessor, params) => {
        const {
            unitId,
            actions,
            textRanges,
            prevTextRanges,
            trigger,
            noHistory,
            isCompositionEnd,
            noNeedSetTextRange,
        } = params;
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const documentDataModel = univerInstanceService.getUniverDocInstance(unitId);

        const docViewModelManagerService = accessor.get(DocViewModelManagerService);
        const documentViewModel = docViewModelManagerService.getViewModel(unitId);

        const textSelectionManagerService = accessor.get(TextSelectionManagerService);
        const selections = textSelectionManagerService.getSelections() ?? [];

        const serializedSelections = selections.map(serializeTextRange);

        const docStateChangeManagerService = accessor.get(DocStateChangeManagerService);

        const imeInputManagerService = accessor.get(IMEInputManagerService);

        if (documentDataModel == null || documentViewModel == null) {
            throw new Error(`DocumentDataModel or documentViewModel not found for unitId: ${unitId}`);
        }

        // TODO: `disabled` is only used for read only demo, and will be removed in the future.
        const disabled = !!documentDataModel.getSnapshot().disabled;

        if (actions.length === 0 || disabled) {
            // The actions' length maybe 0 when the mutation is from collaborative editing.
            // The return result will not be used.
            return {
                unitId,
                actions: [],
                textRanges: serializedSelections,
            };
        }

        // Step 1: Update Doc Data Model.
        const undoActions = documentDataModel.apply(actions);

        // Step 2: Update Doc View Model.
        const { segmentId } = actions[0];
        const segmentDocumentDataModel = documentDataModel.getSelfOrHeaderFooterModel(segmentId);
        const segmentViewModel = documentViewModel.getSelfOrHeaderFooterViewModel(segmentId);

        segmentViewModel.reset(segmentDocumentDataModel);

        // Step 3: Update cursor & selection.
        // Make sure update cursor & selection after doc skeleton is calculated.
        if (!noNeedSetTextRange && textRanges && trigger != null) {
            queueMicrotask(() => {
                textSelectionManagerService.replaceTextRanges(textRanges);
            });
        }

        // Step 4: emit state change event.
        const changeState: IDocStateChangeParams = {
            commandId: RichTextEditingMutationId,
            unitId,
            trigger,
            noHistory,
            redoState: {
                actions,
                textRanges,
            },
            undoState: {
                actions: undoActions,
                textRanges: prevTextRanges ?? serializedSelections,
            },
        };

        // Handle IME input.
        if (isCompositionEnd) {
            const historyParams = imeInputManagerService.fetchComposedUndoRedoMutationParams();

            if (historyParams == null) {
                throw new Error('historyParams is null in RichTextEditingMutation');
            }

            const { undoMutationParams, redoMutationParams, previousActiveRange } = historyParams;
            changeState.redoState.actions = redoMutationParams.actions;
            changeState.undoState.actions = undoMutationParams.actions;
            changeState.undoState.textRanges = [previousActiveRange];
        }

        docStateChangeManagerService.setChangeState(changeState);

        return {
            unitId,
            actions: undoActions,
            textRanges: serializedSelections,
        };
    },
};
