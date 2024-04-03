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

import { Plugin, PluginType } from '@univerjs/core';
import type { Dependency } from '@wendellhu/redi';
import { Inject, Injector } from '@wendellhu/redi';

import { SheetsFindReplaceController } from './controllers/sheet-find-replace.controller';

export interface IFindPluginConfig {}

const NAME = 'UNIVER_SHEETS_FIND_REPLACE_PLUGIN';

export class UniverSheetsFindReplacePlugin extends Plugin {
    static override type = PluginType.Sheet;

    constructor(
        _config: Partial<IFindPluginConfig>,
        @Inject(Injector) protected readonly _injector: Injector
    ) {
        super(NAME);
    }

    override onStarting(injector: Injector): void {
        ([[SheetsFindReplaceController]] as Dependency[]).forEach((d) => {
            injector.add(d);
        });
    }
}
