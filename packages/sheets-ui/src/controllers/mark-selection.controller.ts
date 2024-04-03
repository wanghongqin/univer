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

import type { ICommandInfo } from '@univerjs/core';
import { Disposable, ICommandService, LifecycleStages, OnLifecycle, toDisposable } from '@univerjs/core';
import { Inject } from '@wendellhu/redi';

import { SetCellEditVisibleOperation } from '../commands/operations/cell-edit.operation';
import { IMarkSelectionService } from '../services/mark-selection/mark-selection.service';
import { SheetSkeletonManagerService } from '../services/sheet-skeleton-manager.service';

@OnLifecycle(LifecycleStages.Steady, MarkSelectionController)
export class MarkSelectionController extends Disposable {
    constructor(
        @Inject(IMarkSelectionService) private _markSelectionService: IMarkSelectionService,
        @ICommandService private _commandService: ICommandService,
        @Inject(SheetSkeletonManagerService) private _sheetSkeletonManagerService: SheetSkeletonManagerService
    ) {
        super();
        this._initListeners();
    }

    private _initListeners() {
        this._addRemoveListener();
        this._addRefreshListener();
    }

    private _addRemoveListener() {
        const removeCommands = [SetCellEditVisibleOperation.id];
        this.disposeWithMe(
            this._commandService.onCommandExecuted((command: ICommandInfo) => {
                if (removeCommands.includes(command.id)) {
                    this._markSelectionService.removeAllShapes();
                } else {
                    const shapes = this._markSelectionService.getShapeMap();
                    shapes.forEach((shape, id) => {
                        if (shape.exits.includes(command.id)) {
                            this._markSelectionService.removeShape(id);
                        }
                    });
                }
            })
        );
    }

    private _addRefreshListener() {
        this.disposeWithMe(
            toDisposable(
                this._sheetSkeletonManagerService.currentSkeleton$.subscribe((skeleton) => {
                    if (skeleton) {
                        this._markSelectionService.refreshShapes();
                    }
                })
            )
        );
    }
}
