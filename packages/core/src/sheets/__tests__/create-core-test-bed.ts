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

import { Univer } from '../../basics/univer';
import { IUniverInstanceService } from '../../services/instance/instance.service';
import { ILogService, LogLevel } from '../../services/log/log.service';
import { LocaleType } from '../../types/enum/locale-type';
import type { IWorkbookData } from '../../types/interfaces/i-workbook-data';

const TEST_WORKBOOK_DATA: IWorkbookData = {
    id: 'test',
    appVersion: '3.0.0-alpha',
    sheets: {
        sheet1: {
            id: 'sheet1',
            cellData: {
                0: {
                    0: {
                        v: 'A1',
                    },
                    1: {
                        v: 'B1',
                    },
                },
            },
            name: 'Sheet-001',
        },
    },
    locale: LocaleType.ZH_CN,
    name: '',
    sheetOrder: [],
    styles: {},
};

export function createCoreTestBed(workbookConfig?: IWorkbookData) {
    const univer = new Univer();
    const injector = univer.__getInjector();
    const get = injector.get.bind(injector);

    const sheet = univer.createUniverSheet(workbookConfig || TEST_WORKBOOK_DATA);
    const univerInstanceService = get(IUniverInstanceService);
    univerInstanceService.focusUniverInstance(workbookConfig?.id ?? 'test');

    const logService = get(ILogService);
    logService.setLogLevel(LogLevel.SILENT);

    return {
        univer,
        get,
        sheet,
    };
}
