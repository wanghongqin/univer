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

import type { IWorkbookData } from '@univerjs/core';
import { ILogService, IUniverInstanceService, LocaleType, LogLevel, Plugin, PluginType, Univer } from '@univerjs/core';
import { LexerTreeBuilder } from '@univerjs/engine-formula';
import { SelectionManagerService } from '@univerjs/sheets';
import type { Dependency } from '@wendellhu/redi';
import { Inject, Injector } from '@wendellhu/redi';
import { EditorService, IEditorService } from '@univerjs/ui';
import { IRenderManagerService, RenderManagerService } from '@univerjs/engine-render';
import { FormulaPromptService, IFormulaPromptService } from '../../../services/prompt.service';

const TEST_WORKBOOK_DATA_DEMO: IWorkbookData = {
    id: 'test',
    appVersion: '3.0.0-alpha',
    sheets: {
        sheet1: {
            id: 'sheet1',
            cellData: {
                1: {
                    1: {
                        v: 1,
                    },
                },
            },
        },
    },
    locale: LocaleType.ZH_CN,
    name: '',
    sheetOrder: [],
    styles: {},
};

export function createCommandTestBed(workbookConfig?: IWorkbookData, dependencies?: Dependency[]) {
    const univer = new Univer();
    const injector = univer.__getInjector();
    const get = injector.get.bind(injector);

    /**
     * This plugin hooks into Sheet's DI system to expose API to test scripts
     */
    class TestPlugin extends Plugin {
        static override type = PluginType.Sheet;

        constructor(
            _config: undefined,
            @Inject(Injector) override readonly _injector: Injector
        ) {
            super('test-plugin');

            this._injector = _injector;
        }

        override onStarting(injector: Injector): void {
            injector.add([SelectionManagerService]);
            injector.add([LexerTreeBuilder]);
            injector.add([IFormulaPromptService, { useClass: FormulaPromptService }]);
            injector.add([IEditorService, { useClass: EditorService }]);
            injector.add([IRenderManagerService, { useClass: RenderManagerService }]);

            dependencies?.forEach((d) => injector.add(d));
        }
    }

    univer.registerPlugin(TestPlugin);
    const sheet = univer.createUniverSheet(workbookConfig || TEST_WORKBOOK_DATA_DEMO);

    const univerInstanceService = get(IUniverInstanceService);
    univerInstanceService.focusUniverInstance('test');

    const logService = get(ILogService);
    logService.setLogLevel(LogLevel.SILENT); // change this to `LogLevel.VERBOSE` to debug tests via logs

    return {
        univer,
        get,
        sheet,
    };
}
