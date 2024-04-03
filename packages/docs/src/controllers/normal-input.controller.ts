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

import type { Nullable } from '@univerjs/core';
import { Disposable, ICommandService, IUniverInstanceService, LifecycleStages, OnLifecycle } from '@univerjs/core';
import { IRenderManagerService, ITextSelectionRenderManager } from '@univerjs/engine-render';
import { Inject } from '@wendellhu/redi';
import type { Subscription } from 'rxjs';

import { getDocObject } from '../basics/component-tools';
import { InsertCommand } from '../commands/commands/core-editing.command';
import { DocSkeletonManagerService } from '../services/doc-skeleton-manager.service';

@OnLifecycle(LifecycleStages.Rendered, NormalInputController)
export class NormalInputController extends Disposable {
    private _onInputSubscription: Nullable<Subscription>;

    constructor(
        @Inject(DocSkeletonManagerService) private readonly _docSkeletonManagerService: DocSkeletonManagerService,
        @IUniverInstanceService private readonly _currentUniverService: IUniverInstanceService,
        @IRenderManagerService private readonly _renderManagerService: IRenderManagerService,
        @ITextSelectionRenderManager private readonly _textSelectionRenderManager: ITextSelectionRenderManager,
        @ICommandService private readonly _commandService: ICommandService
    ) {
        super();

        this._initialize();

        this._commandExecutedListener();
    }

    override dispose(): void {
        this._onInputSubscription?.unsubscribe();
    }

    private _initialize() {
        this._initialNormalInput();
    }

    private _initialNormalInput() {
        this._onInputSubscription = this._textSelectionRenderManager.onInput$.subscribe(async (config) => {
            if (config == null) {
                return;
            }

            const documentModel = this._currentUniverService.getCurrentUniverDocInstance();

            const unitId = documentModel.getUnitId();

            const { event, content = '', activeRange } = config;

            const e = event as InputEvent;

            const skeleton = this._docSkeletonManagerService.getCurrent()?.skeleton;

            if (e.data == null || skeleton == null) {
                return;
            }

            if (!skeleton || !activeRange) {
                return;
            }

            const { startOffset, segmentId, style } = activeRange;

            const len = content.length;

            const textRanges = [
                {
                    startOffset: startOffset + len,
                    endOffset: startOffset + len,
                    style,
                },
            ];

            await this._commandService.executeCommand(InsertCommand.id, {
                unitId,
                body: {
                    dataStream: content,
                },
                range: activeRange,
                textRanges,
                segmentId,
            });
        });
    }

    private _commandExecutedListener() {}

    private _getDocObject() {
        return getDocObject(this._currentUniverService, this._renderManagerService);
    }
}
