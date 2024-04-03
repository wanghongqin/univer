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

import type { DocumentDataModel, Nullable } from '@univerjs/core';
import { DOCS_NORMAL_EDITOR_UNIT_ID_KEY, IUniverInstanceService, RxDisposable } from '@univerjs/core';
import { DocumentViewModel } from '@univerjs/engine-render';
import { BehaviorSubject, takeUntil } from 'rxjs';

export interface IDocumentViewModelManagerParam {
    unitId: string;
    docViewModel: DocumentViewModel;
}

/**
 * The view model manager is used to manage Doc view model. has a one-to-one correspondence with the doc skeleton.
 */
export class DocViewModelManagerService extends RxDisposable {
    private _docViewModelMap: Map<string, IDocumentViewModelManagerParam> = new Map();

    private readonly _currentDocViewModel$ = new BehaviorSubject<Nullable<IDocumentViewModelManagerParam>>(null);
    readonly currentDocViewModel$ = this._currentDocViewModel$.asObservable();

    constructor(@IUniverInstanceService private readonly _currentUniverService: IUniverInstanceService) {
        super();
        this._initialize();
    }

    private _initialize() {
        this._init();
    }

    override dispose(): void {
        this._currentDocViewModel$.complete();
        this._docViewModelMap.clear();
    }

    private _init() {
        this._currentUniverService.currentDoc$.pipe(takeUntil(this.dispose$)).subscribe((documentModel) => {
            this._create(documentModel);
        });

        this._currentUniverService.getAllUniverDocsInstance().forEach((documentModel) => {
            this._create(documentModel);
        });

        this._currentUniverService.docDisposed$.pipe(takeUntil(this.dispose$)).subscribe((documentModel) => {
            this._docViewModelMap.delete(documentModel.getUnitId());
        });
    }

    private _create(documentModel: Nullable<DocumentDataModel>) {
        if (documentModel == null) {
            return;
        }

        const unitId = documentModel.getUnitId();
        // Build the view model and notify the skeleton manager to create the skeleton.
        this._setCurrent(unitId);
    }

    getAllModel() {
        return this._docViewModelMap;
    }

    getViewModel(unitId: string) {
        return this._docViewModelMap.get(unitId)?.docViewModel;
    }

    private _setCurrent(unitId: string) {
        const documentDataModel = this._currentUniverService.getUniverDocInstance(unitId);
        if (documentDataModel == null) {
            throw new Error(`Document data model with id ${unitId} not found when build view model.`);
        }

        // No need to build view model, if data model has no body.
        if (documentDataModel.getBody() == null) {
            return;
        }

        if (!this._docViewModelMap.has(unitId)) {
            const docViewModel = this._buildDocViewModel(documentDataModel);

            this._docViewModelMap.set(unitId, {
                unitId,
                docViewModel,
            });
        }

        // Always need to reset document data model, because cell editor change doc instance every time.
        if (unitId === DOCS_NORMAL_EDITOR_UNIT_ID_KEY) {
            const docViewModel = this._docViewModelMap.get(unitId)?.docViewModel;

            if (docViewModel == null) {
                return;
            }

            docViewModel.reset(documentDataModel);
        }

        this._currentDocViewModel$.next(this._docViewModelMap.get(unitId));
    }

    private _buildDocViewModel(documentDataModel: DocumentDataModel) {
        return new DocumentViewModel(documentDataModel);
    }
}
