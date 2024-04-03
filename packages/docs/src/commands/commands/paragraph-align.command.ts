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

import type { ICommand, IMutationInfo, IParagraphStyle } from '@univerjs/core';
import { CommandType, HorizontalAlign,
    ICommandService,
    IUniverInstanceService,
    MemoryCursor,
    TextX,
    TextXActionType,
    UpdateDocsAttributeType,
} from '@univerjs/core';

import { serializeTextRange, TextSelectionManagerService } from '../../services/text-selection-manager.service';
import type { IRichTextEditingMutationParams } from '../mutations/core-editing.mutation';
import { RichTextEditingMutation } from '../mutations/core-editing.mutation';
import { getParagraphsInRange } from './list.command';

interface IAlignOperationCommandParams {
    alignType: HorizontalAlign;
}

export const AlignOperationCommand: ICommand<IAlignOperationCommandParams> = {
    id: 'doc.command.align-operation',

    type: CommandType.COMMAND,

    handler: (accessor, params: IAlignOperationCommandParams) => {
        const textSelectionManagerService = accessor.get(TextSelectionManagerService);
        const currentUniverService = accessor.get(IUniverInstanceService);
        const commandService = accessor.get(ICommandService);

        const { alignType } = params;

        const dataModel = currentUniverService.getCurrentUniverDocInstance();

        const activeRange = textSelectionManagerService.getActiveRange();
        const selections = textSelectionManagerService.getSelections() ?? [];
        const paragraphs = dataModel.getBody()?.paragraphs;
        const serializedSelections = selections.map(serializeTextRange);

        if (activeRange == null || paragraphs == null) {
            return false;
        }

        const currentParagraphs = getParagraphsInRange(activeRange, paragraphs);

        const { segmentId } = activeRange;

        const unitId = dataModel.getUnitId();

        const isAlreadyAligned = currentParagraphs.every((paragraph) => paragraph.paragraphStyle?.horizontalAlign === alignType);

        const doMutation: IMutationInfo<IRichTextEditingMutationParams> = {
            id: RichTextEditingMutation.id,
            params: {
                unitId,
                actions: [],
                textRanges: serializedSelections,
            },
        };

        const memoryCursor = new MemoryCursor();

        memoryCursor.reset();

        const textX = new TextX();

        for (const paragraph of currentParagraphs) {
            const { startIndex } = paragraph;

            textX.push({
                t: TextXActionType.RETAIN,
                len: startIndex - memoryCursor.cursor,
                segmentId,
            });

            // See: univer/packages/engine-render/src/components/docs/block/paragraph/layout-ruler.ts line:802 comments.
            const paragraphStyle: IParagraphStyle = {
                ...paragraph.paragraphStyle,
                horizontalAlign: isAlreadyAligned ? HorizontalAlign.UNSPECIFIED : alignType,
            };

            textX.push({
                t: TextXActionType.RETAIN,
                len: 1,
                body: {
                    dataStream: '',
                    paragraphs: [
                        {
                            ...paragraph,
                            paragraphStyle,
                            startIndex: 0,
                        },
                    ],
                },
                segmentId,
                coverType: UpdateDocsAttributeType.REPLACE,
            });

            memoryCursor.moveCursorTo(startIndex + 1);
        }

        doMutation.params.actions = textX.serialize();

        const result = commandService.syncExecuteCommand<
            IRichTextEditingMutationParams,
            IRichTextEditingMutationParams
        >(doMutation.id, doMutation.params);

        return Boolean(result);
    },
};

interface IAlignLeftCommandParams {}

export const AlignLeftCommand: ICommand<IAlignLeftCommandParams> = {
    id: 'doc.command.align-left',

    type: CommandType.COMMAND,

    handler: (accessor) => {
        const commandService = accessor.get(ICommandService);

        return commandService.syncExecuteCommand(AlignOperationCommand.id, {
            alignType: HorizontalAlign.LEFT,
        });
    },
};

interface IAlignCenterCommandParams {}

export const AlignCenterCommand: ICommand<IAlignCenterCommandParams> = {
    id: 'doc.command.align-center',

    type: CommandType.COMMAND,

    handler: (accessor) => {
        const commandService = accessor.get(ICommandService);

        return commandService.syncExecuteCommand(AlignOperationCommand.id, {
            alignType: HorizontalAlign.CENTER,
        });
    },
};

interface IAlignRightCommandParams {}

export const AlignRightCommand: ICommand<IAlignRightCommandParams> = {
    id: 'doc.command.align-right',

    type: CommandType.COMMAND,

    handler: (accessor) => {
        const commandService = accessor.get(ICommandService);

        return commandService.syncExecuteCommand(AlignOperationCommand.id, {
            alignType: HorizontalAlign.RIGHT,
        });
    },
};

interface IAlignJustifyCommandParams {}

export const AlignJustifyCommand: ICommand<IAlignJustifyCommandParams> = {
    id: 'doc.command.align-justify',

    type: CommandType.COMMAND,

    handler: (accessor) => {
        const commandService = accessor.get(ICommandService);

        return commandService.syncExecuteCommand(AlignOperationCommand.id, {
            alignType: HorizontalAlign.JUSTIFIED,
        });
    },
};
