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
import { Disposable, ICommandService, LifecycleStages, OnLifecycle } from '@univerjs/core';

import {
    IOtherFormulaManagerService,
} from '../services/other-formula-manager.service';
import { RemoveOtherFormulaMutation, SetOtherFormulaMutation } from '../commands/mutations/set-other-formula.mutation';
import type { IRemoveOtherFormulaMutationParams, ISetOtherFormulaMutationParams } from '../commands/mutations/set-other-formula.mutation';

@OnLifecycle(LifecycleStages.Ready, SetOtherFormulaController)
export class SetOtherFormulaController extends Disposable {
    constructor(
        @ICommandService private readonly _commandService: ICommandService,
        @IOtherFormulaManagerService private readonly _otherFormulaManagerService: IOtherFormulaManagerService
    ) {
        super();

        this._initialize();
    }

    private _initialize(): void {
        this._commandExecutedListener();
    }

    private _commandExecutedListener() {
        this.disposeWithMe(
            this._commandService.onCommandExecuted((command: ICommandInfo) => {
                if (command.id === SetOtherFormulaMutation.id) {
                    const params = command.params as ISetOtherFormulaMutationParams;
                    if (params == null) {
                        return;
                    }
                    const config = { [params.unitId]: { [params.subUnitId]: params.formulaMap } };
                    this._otherFormulaManagerService.batchRegister(config);
                } else if (command.id === RemoveOtherFormulaMutation.id) {
                    const params = command.params as IRemoveOtherFormulaMutationParams;
                    if (params == null) {
                        return;
                    }
                    const obj: Record<string, true> = {};
                    params.formulaIdList.forEach((id) => obj[id] = true);
                    const config = { [params.unitId]: { [params.subUnitId]: obj } };
                    this._otherFormulaManagerService.batchRemove(config);
                }
            })
        );
    }
}
