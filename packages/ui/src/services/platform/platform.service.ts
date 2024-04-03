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

import { createIdentifier } from '@wendellhu/redi';

/**
 * A service to provide context info of the host service.
 */
export interface IPlatformService {
    readonly isMac: boolean;
    readonly isWindows: boolean;
    readonly isLinux: boolean;
}

export const IPlatformService = createIdentifier<IPlatformService>('univer.platform-service');

export class DesktopPlatformService implements IPlatformService {
    get isMac(): boolean {
        return /Mac/.test(navigator.appVersion);
    }

    get isWindows(): boolean {
        return /Windows/.test(navigator.appVersion);
    }

    get isLinux(): boolean {
        return /Linux/.test(navigator.appVersion);
    }
}
