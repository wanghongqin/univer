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

import type { UniverInstanceType } from '@univerjs/core';
import { IUniverInstanceService } from '@univerjs/core';
import type { IAccessor } from '@wendellhu/redi';
import { Observable } from 'rxjs';

export function getMenuHiddenObservable(
    accessor: IAccessor,
    targetUniverType: UniverInstanceType
): Observable<boolean> {
    const univerInstanceService = accessor.get(IUniverInstanceService);

    return new Observable((subscriber) => {
        const subscription = univerInstanceService.focused$.subscribe((unitId) => {
            if (unitId == null) {
                return subscriber.next(true);
            }
            const univerType = univerInstanceService.getDocumentType(unitId);

            subscriber.next(univerType !== targetUniverType);
        });

        const focusedUniverInstance = univerInstanceService.getFocusedUniverInstance();

        if (focusedUniverInstance == null) {
            return subscriber.next(true);
        }

        const univerType = univerInstanceService.getDocumentType(focusedUniverInstance.getUnitId());
        subscriber.next(univerType !== targetUniverType);

        return () => subscription.unsubscribe();
    });
}
