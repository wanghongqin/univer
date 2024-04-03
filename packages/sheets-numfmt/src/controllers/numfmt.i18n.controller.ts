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

import { Disposable, LifecycleStages, LocaleService, OnLifecycle } from '@univerjs/core';
import { Inject } from '@wendellhu/redi';

import { enUS, zhCN } from '../locale';

@OnLifecycle(LifecycleStages.Rendered, NumfmtI18nController)
export class NumfmtI18nController extends Disposable {
    constructor(@Inject(LocaleService) private _localeService: LocaleService) {
        super();
        this._initLocal();
    }

    private _initLocal = () => {
        this._localeService.load({ zhCN, enUS });
    };
}
