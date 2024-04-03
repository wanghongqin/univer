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

import type { IPageElement, PageElementType } from '@univerjs/core';
import { Registry } from '@univerjs/core';
import type { Scene } from '@univerjs/engine-render';
import type { Injector } from '@wendellhu/redi';

export class ObjectAdaptor {
    zIndex = 0;

    viewKey: PageElementType | null = null;

    check(type: PageElementType) {
        if (type !== this.viewKey) {
            return;
        }
        return this;
    }

    convert(pageElement: IPageElement, mainScene: Scene) {}

    create(injector: Injector) {}
}

export const CanvasObjectProviderRegistry = Registry.create();
