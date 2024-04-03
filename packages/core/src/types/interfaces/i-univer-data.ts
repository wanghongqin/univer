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

import type { LogLevel } from '../../services/log/log.service';
import type { IStyleSheet } from '../../services/theme/theme.service';
import type { ILocales } from '../../shared/locale';
import type { LocaleType } from '../enum';

export interface IUniverData {
    theme: IStyleSheet;
    locale: LocaleType;
    locales: ILocales;
    logLevel: LogLevel;
    id: string;
}

/**
 * Toolbar Observer generic interface, convenient for plug-ins to define their own types
 */
export interface UIObserver<T = string> {
    /**
     * fontSize, fontFamily,color...
     */
    name: string;

    /**
     * fontSize:number, fontFamily:string ...
     */
    value?: T;
}
