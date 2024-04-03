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

import {
    ICommandService,
    IContextService,
    ILogService,
    IUniverInstanceService,
    LifecycleStages,
    LocaleService,
    OnLifecycle,
    RxDisposable,
} from '@univerjs/core';
import { SearchSingle16 } from '@univerjs/icons';
import {
    ComponentManager,
    IDialogService,
    ILayoutService,
    IMenuService,
    IShortcutService,
} from '@univerjs/ui';
import { Inject, Injector } from '@wendellhu/redi';
import { takeUntil } from 'rxjs';

import {
    GoToNextMatchOperation,
    GoToPreviousMatchOperation,
    OpenFindDialogOperation,
    OpenReplaceDialogOperation,
} from '../commands/operations/find-replace.operation';
import { IFindReplaceService } from '../services/find-replace.service';
import { FindReplaceDialog } from '../views/dialog/FindReplaceDialog';
import { ReplaceAllMatchesCommand, ReplaceCurrentMatchCommand } from '../commands/command/replace.command';
import {
    GoToNextFindMatchShortcutItem,
    GoToPreviousFindMatchShortcutItem,
    MacOpenFindDialogShortcutItem,
    OpenFindDialogShortcutItem,
    OpenReplaceDialogShortcutItem,
} from './find-replace.shortcut';
import { FindReplaceMenuItemFactory } from './find-replace.menu';

const FIND_REPLACE_DIALOG_ID = 'DESKTOP_FIND_REPLACE_DIALOG';

const FIND_REPLACE_PANEL_WIDTH = 350;
const FIND_REPLACE_PANEL_RIGHT_PADDING = 20;
const FIND_REPLACE_PANEL_TOP_PADDING = -90;

@OnLifecycle(LifecycleStages.Rendered, FindReplaceController)
export class FindReplaceController extends RxDisposable {
    constructor(
        @IUniverInstanceService private readonly _univerInstanceService: IUniverInstanceService,
        @IMenuService private readonly _menuService: IMenuService,
        @IShortcutService private readonly _shortcutService: IShortcutService,
        @ICommandService private readonly _commandService: ICommandService,
        @IFindReplaceService private readonly _findReplaceService: IFindReplaceService,
        @ILogService private readonly _logService: ILogService,
        @IDialogService private readonly _dialogService: IDialogService,
        @IContextService private readonly _contextService: IContextService,
        @ILayoutService private readonly _layoutService: ILayoutService,
        @Inject(LocaleService) private readonly _localeService: LocaleService,
        @Inject(ComponentManager) private readonly _componentManager: ComponentManager,
        @Inject(Injector) private readonly _injector: Injector
    ) {
        super();

        this._initCommands();
        this._initUI();
        this._initShortcuts();
    }

    private _initCommands(): void {
        [
            OpenFindDialogOperation,
            OpenReplaceDialogOperation,
            GoToNextMatchOperation,
            GoToPreviousMatchOperation,
            ReplaceAllMatchesCommand,
            ReplaceCurrentMatchCommand,
        ].forEach((c) => {
            this.disposeWithMe(this._commandService.registerCommand(c));
        });
    }

    private _initShortcuts(): void {
        [
            OpenReplaceDialogShortcutItem,
            OpenFindDialogShortcutItem,
            MacOpenFindDialogShortcutItem,
            GoToPreviousFindMatchShortcutItem,
            GoToNextFindMatchShortcutItem,
        ].forEach((s) => this.disposeWithMe(this._shortcutService.registerShortcut(s)));
    }

    private _initUI(): void {
        this.disposeWithMe(this._menuService.addMenuItem(this._injector.invoke(FindReplaceMenuItemFactory)));
        this.disposeWithMe(this._componentManager.register('FindReplaceDialog', FindReplaceDialog));
        this.disposeWithMe(this._componentManager.register('SearchIcon', SearchSingle16));

        // this controller is also responsible for toggling the FindReplaceDialog
        this._findReplaceService.stateUpdates$.pipe(takeUntil(this.dispose$)).subscribe((newState) => {
            if (newState.revealed === true) {
                this._openPanel();
            }
        });

        // If focusing on a non-sheet Univer document, close the find replace dialog.
        this.disposeWithMe(
            this._univerInstanceService.focused$.pipe(takeUntil(this.dispose$)).subscribe((focused) => {
                if (!focused || !this._univerInstanceService.getUniverSheetInstance(focused)) {
                    this.closePanel();
                }
            })
        );
    }

    private _openPanel(): void {
        this._dialogService.open({
            id: FIND_REPLACE_DIALOG_ID,
            draggable: true,
            width: FIND_REPLACE_PANEL_WIDTH,
            title: { title: this._localeService.t('find-replace.dialog.title') },
            children: { label: 'FindReplaceDialog' },
            destroyOnClose: true,
            defaultPosition: getFindReplaceDialogDefaultPosition(),
            preservePositionOnDestroy: true,
            onClose: () => this.closePanel(),
        });
    }

    closePanel(): void {
        this._dialogService.close(FIND_REPLACE_DIALOG_ID);
        this._findReplaceService.terminate();

        queueMicrotask(() => this._layoutService.focus());
    }
}

function getFindReplaceDialogDefaultPosition(): { x: number; y: number } {
    const { innerWidth } = window;
    const x = (innerWidth - FIND_REPLACE_PANEL_WIDTH) / 2 - FIND_REPLACE_PANEL_RIGHT_PADDING;
    const y = FIND_REPLACE_PANEL_TOP_PADDING;

    return { x, y };
}
