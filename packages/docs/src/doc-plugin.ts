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

import type { ICommand } from '@univerjs/core';
import {
    ICommandService,
    Plugin,
    PluginType,
} from '@univerjs/core';
import { ITextSelectionRenderManager, TextSelectionRenderManager } from '@univerjs/engine-render';
import type { Dependency } from '@wendellhu/redi';
import { Inject, Injector } from '@wendellhu/redi';
import { BreakLineCommand } from './commands/commands/break-line.command';
import { DeleteCommand, InsertCommand, UpdateCommand } from './commands/commands/core-editing.command';
import { DeleteLeftCommand, DeleteRightCommand, MergeTwoParagraphCommand } from './commands/commands/delete.command';
import { IMEInputCommand } from './commands/commands/ime-input.command';
import {
    SetInlineFormatBoldCommand,
    SetInlineFormatCommand,
    SetInlineFormatFontFamilyCommand,
    SetInlineFormatFontSizeCommand,
    SetInlineFormatItalicCommand,
    SetInlineFormatStrikethroughCommand,
    SetInlineFormatSubscriptCommand,
    SetInlineFormatSuperscriptCommand,
    SetInlineFormatTextColorCommand,
    SetInlineFormatUnderlineCommand,
} from './commands/commands/inline-format.command';
import { BulletListCommand, ListOperationCommand, OrderListCommand } from './commands/commands/list.command';
import { CoverContentCommand, ReplaceContentCommand } from './commands/commands/replace-content.command';
import { SetDocZoomRatioCommand } from './commands/commands/set-doc-zoom-ratio.command';
import { RichTextEditingMutation } from './commands/mutations/core-editing.mutation';
import { MoveCursorOperation, MoveSelectionOperation } from './commands/operations/cursor.operation';
import { SelectAllOperation } from './commands/operations/select-all.operation';
import { SetDocZoomRatioOperation } from './commands/operations/set-doc-zoom-ratio.operation';
import { SetTextSelectionsOperation } from './commands/operations/text-selection.operation';
import { IMEInputController } from './controllers/ime-input.controller';
import { MoveCursorController } from './controllers/move-cursor.controller';
import { NormalInputController } from './controllers/normal-input.controller';
import { DocSkeletonManagerService } from './services/doc-skeleton-manager.service';
import { DocViewModelManagerService } from './services/doc-view-model-manager.service';
import { IMEInputManagerService } from './services/ime-input-manager.service';
import { TextSelectionManagerService } from './services/text-selection-manager.service';
import { DocStateChangeManagerService } from './services/doc-state-change-manager.service';
import { AlignCenterCommand, AlignJustifyCommand, AlignLeftCommand, AlignOperationCommand, AlignRightCommand } from './commands/commands/paragraph-align.command';

export interface IUniverDocsConfig {
    hasScroll?: boolean;
}

const DEFAULT_DOCUMENT_PLUGIN_DATA = {
    hasScroll: true,
};

const PLUGIN_NAME = 'docs';

export class UniverDocsPlugin extends Plugin {
    static override type = PluginType.Doc;

    private _config: IUniverDocsConfig;

    constructor(
        config: Partial<IUniverDocsConfig> = {},
        @Inject(Injector) override _injector: Injector
    ) {
        super(PLUGIN_NAME);

        this._config = Object.assign(DEFAULT_DOCUMENT_PLUGIN_DATA, config);

        this._initializeDependencies(_injector);

        this._initializeCommands();
    }

    initialize(): void {}

    private _initializeCommands(): void {
        (
            [
                MoveCursorOperation,
                MoveSelectionOperation,
                DeleteLeftCommand,
                DeleteRightCommand,
                SetInlineFormatBoldCommand,
                SetInlineFormatItalicCommand,
                SetInlineFormatUnderlineCommand,
                SetInlineFormatStrikethroughCommand,
                SetInlineFormatSubscriptCommand,
                SetInlineFormatSuperscriptCommand,
                SetInlineFormatFontSizeCommand,
                SetInlineFormatFontFamilyCommand,
                SetInlineFormatTextColorCommand,
                SetInlineFormatCommand,
                BreakLineCommand,
                InsertCommand,
                DeleteCommand,
                UpdateCommand,
                IMEInputCommand,
                MergeTwoParagraphCommand,
                RichTextEditingMutation,
                ReplaceContentCommand,
                CoverContentCommand,
                SetDocZoomRatioCommand,
                SetDocZoomRatioOperation,
                SetTextSelectionsOperation,
                SelectAllOperation,
                OrderListCommand,
                BulletListCommand,
                ListOperationCommand,
                AlignLeftCommand,
                AlignCenterCommand,
                AlignRightCommand,
                AlignOperationCommand,
                AlignJustifyCommand,
            ] as ICommand[]
        ).forEach((command) => {
            this._injector.get(ICommandService).registerCommand(command);
        });
    }

    override onReady(): void {
        this.initialize();
    }

    private _initializeDependencies(docInjector: Injector) {
        (
            [
                // services
                [DocSkeletonManagerService],
                [DocViewModelManagerService],
                [DocStateChangeManagerService],
                [IMEInputManagerService],
                [
                    ITextSelectionRenderManager,
                    {
                        useClass: TextSelectionRenderManager,
                    },
                ],
                [TextSelectionManagerService],

                // controllers
                [NormalInputController],
                [IMEInputController],
                [MoveCursorController],
            ] as Dependency[]
        ).forEach((d) => docInjector.add(d));
    }
}
