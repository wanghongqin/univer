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
import { BehaviorSubject, Observable } from 'rxjs';

import { Disposable, toDisposable } from '../../shared/lifecycle';
import { ILogService } from '../log/log.service';
import { LifecycleNameMap, LifecycleStages, LifecycleToModules } from './lifecycle';

/**
 * This service controls the lifecycle of a Univer instance. Other modules can
 * inject this service to read the current lifecycle stage or subscribe to
 * lifecycle changes.
 */
export class LifecycleService extends Disposable {
    private _lifecycle$ = new BehaviorSubject<LifecycleStages>(LifecycleStages.Starting);
    readonly lifecycle$ = this._lifecycle$.asObservable();

    constructor(@ILogService private readonly _logService: ILogService) {
        super();

        this._reportProgress(LifecycleStages.Starting);
    }

    get stage(): LifecycleStages {
        return this._lifecycle$.getValue();
    }

    set stage(stage: LifecycleStages) {
        if (stage < this.stage) {
            throw new Error('[LifecycleService]: lifecycle stage cannot go backward!');
        }

        if (stage === this.stage) {
            return;
        }

        this._reportProgress(stage);
        this._lifecycle$.next(stage);
    }

    override dispose(): void {
        this._lifecycle$.complete();

        super.dispose();
    }

    /**
     * Subscribe to lifecycle changes and all previous stages and the current
     * stage will be emitted immediately.
     * @returns
     */
    subscribeWithPrevious(): Observable<LifecycleStages> {
        return new Observable<LifecycleStages>((subscriber) => {
            // Before subscribe, emit the current stage and all previous stages.
            // Since `this._lifecycle$` is a BehaviorSubject, it will emit the current stage immediately.
            // So we just need to manually next all previous stages.
            if (this.stage === LifecycleStages.Starting) {
                // do nothing
            } else if (this.stage === LifecycleStages.Ready) {
                subscriber.next(LifecycleStages.Starting);
            } else if (this.stage === LifecycleStages.Rendered) {
                subscriber.next(LifecycleStages.Starting);
                subscriber.next(LifecycleStages.Ready);
            } else {
                subscriber.next(LifecycleStages.Starting);
                subscriber.next(LifecycleStages.Ready);
                subscriber.next(LifecycleStages.Rendered);
            }

            return this._lifecycle$.subscribe(subscriber);
        });
    }

    private _reportProgress(stage: LifecycleStages): void {
        this._logService.debug('[LifecycleService]', `lifecycle progressed to "${LifecycleNameMap[stage]}".`);
    }
}

/**
 * This service is used to initialize modules on a certain lifecycle stage.
 * Refer to `runOnLifecycle` and `OnLifecycle` for more details.
 *
 * @internal
 */
export class LifecycleInitializerService extends Disposable {
    private _started = false;

    constructor(
        @Inject(LifecycleService) private _lifecycleService: LifecycleService,
        @Inject(Injector) private readonly _injector: Injector
    ) {
        super();
    }

    start(): void {
        if (this._started) {
            return;
        }

        this._started = true;
        this.disposeWithMe(
            toDisposable(
                this._lifecycleService.subscribeWithPrevious().subscribe((stage) => this.initModulesOnStage(stage))
            )
        );
    }

    initModulesOnStage(stage: LifecycleStages): void {
        const modules = LifecycleToModules.get(stage);
        modules?.forEach((m) => {
            if (this._injector.has(m)) {
                this._injector.get(m);
            }
        });
    }
}
