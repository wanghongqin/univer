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

import type { ICommand, IDocumentData, Univer } from '@univerjs/core';
import { ICommandService, IUniverInstanceService, RedoCommand, UndoCommand } from '@univerjs/core';
import type { Injector } from '@wendellhu/redi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TextSelectionManagerService } from '../../../services/text-selection-manager.service';
import { RichTextEditingMutation } from '../../mutations/core-editing.mutation';
import { SetTextSelectionsOperation } from '../../operations/text-selection.operation';
import { CoverContentCommand, ReplaceContentCommand } from '../replace-content.command';
import { createCommandTestBed } from './create-command-test-bed';

vi.mock('@univerjs/engine-render', async () => {
    const actual = await vi.importActual('@univerjs/engine-render');
    const { ITextSelectionRenderManager, TextSelectionRenderManager } = await import(
        './mock-text-selection-render-manager'
    );

    return {
        ...actual,
        ITextSelectionRenderManager,
        TextSelectionRenderManager,
    };
});

const TEST_DOCUMENT_DATA_EN: IDocumentData = {
    id: 'test-doc',
    body: {
        dataStream: '=SUM(A2:B4)\r\n',
    },
    documentStyle: {
        pageSize: {
            width: 594.3,
            height: 840.51,
        },
        marginTop: 72,
        marginBottom: 72,
        marginRight: 90,
        marginLeft: 90,
    },
};

describe('replace or cover content of document', () => {
    let univer: Univer;
    let get: Injector['get'];
    let commandService: ICommandService;

    function getDataStream() {
        const univerInstanceService = get(IUniverInstanceService);
        const docsModel = univerInstanceService.getUniverDocInstance('test-doc');

        if (docsModel?.body?.dataStream == null) {
            return '';
        }

        return docsModel?.body?.dataStream;
    }

    beforeEach(() => {
        const testBed = createCommandTestBed(TEST_DOCUMENT_DATA_EN);
        univer = testBed.univer;
        get = testBed.get;

        commandService = get(ICommandService);
        commandService.registerCommand(ReplaceContentCommand);
        commandService.registerCommand(CoverContentCommand);
        commandService.registerCommand(SetTextSelectionsOperation);
        commandService.registerCommand(RichTextEditingMutation as unknown as ICommand);

        const selectionManager = get(TextSelectionManagerService);

        selectionManager.setCurrentSelection({
            unitId: 'test-doc',
            subUnitId: '',
        });

        selectionManager.add([
            {
                startOffset: 5,
                endOffset: 5,
            },
        ]);
    });

    afterEach(() => univer.dispose());

    describe('replace content of document and reserve undo and redo stack', () => {
        it('Should pass the test case when replace content', async () => {
            expect(getDataStream().length).toBe(13);
            const commandParams = {
                unitId: 'test-doc',
                body: {
                    dataStream: '=AVERAGE(A4:B8)',
                }, // Do not contain `\r\n` at the end.
                textRanges: [],
                segmentId: '',
            };

            await commandService.executeCommand(ReplaceContentCommand.id, commandParams);

            expect(getDataStream().length).toBe(17);

            await commandService.executeCommand(UndoCommand.id);

            expect(getDataStream().length).toBe(13);

            await commandService.executeCommand(RedoCommand.id);

            expect(getDataStream().length).toBe(17);

            // recovery the doc.
            await commandService.executeCommand(UndoCommand.id);
        });
    });

    describe('cover content of document and clear undo and redo stack', () => {
        it('Should pass the test case when cover content', async () => {
            expect(getDataStream().length).toBe(13);
            const commandParams = {
                unitId: 'test-doc',
                body: {
                    dataStream: '=AVERAGE(A4:B8)',
                }, // Do not contain `\r\n` at the end.
                textRanges: [],
                segmentId: '',
            };

            await commandService.executeCommand(CoverContentCommand.id, commandParams);

            expect(getDataStream().length).toBe(17);

            await commandService.executeCommand(UndoCommand.id);

            expect(getDataStream().length).toBe(17);

            await commandService.executeCommand(RedoCommand.id);

            expect(getDataStream().length).toBe(17);
        });
    });
});
