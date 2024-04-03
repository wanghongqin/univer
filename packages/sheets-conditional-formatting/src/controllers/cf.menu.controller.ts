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

import { Inject, Injector } from '@wendellhu/redi';
import { Disposable, LifecycleStages, LocaleService, OnLifecycle } from '@univerjs/core';
import { ComponentManager, IMenuService, ISidebarService } from '@univerjs/ui';
import { FactoryManageConditionalFormattingRule } from '../menu/manage-rule';
import type { IConditionFormattingRule } from '../models/type';
import { ConditionFormattingPanel } from '../components/panel';

const CF_PANEL_KEY = 'sheet.conditional.formatting.panel';
@OnLifecycle(LifecycleStages.Ready, ConditionalFormattingMenuController)
export class ConditionalFormattingMenuController extends Disposable {
    constructor(
        @Inject(Injector) private _injector: Injector,
        @Inject(ComponentManager) private _componentManager: ComponentManager,
        @Inject(IMenuService) private _menuService: IMenuService,
        @Inject(ISidebarService) private _sidebarService: ISidebarService,
        @Inject(LocaleService) private _localeService: LocaleService

    ) {
        super();
        this._initMenu();
        this._initPanel();
    }

    openPanel(rule?: IConditionFormattingRule) {
        const props = {
            header: { title: this._localeService.t('sheet.cf.title') },
            children: {
                label: CF_PANEL_KEY,
                rule,
            },
        };
        this._sidebarService.open(props);
    }

    private _initMenu() {
        this._menuService.addMenuItem(FactoryManageConditionalFormattingRule(this._componentManager)(this._injector));
    }

    private _initPanel() {
        this._componentManager.register(CF_PANEL_KEY, ConditionFormattingPanel);
    }
}
