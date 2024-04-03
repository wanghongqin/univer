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

import type { ICellData, ICellDataForSheetInterceptor } from '@univerjs/core';
import {
    CellValueType,
    Disposable,
    ICommandService,
    LifecycleStages,
    LocaleService,
    ObjectMatrix,
    OnLifecycle,
    Range,
    ThemeService,
    toDisposable,
} from '@univerjs/core';
import type { ISetNumfmtMutationParams } from '@univerjs/sheets';
import { INTERCEPTOR_POINT, INumfmtService, SetNumfmtMutation, SheetInterceptorService } from '@univerjs/sheets';
import { SheetSkeletonManagerService } from '@univerjs/sheets-ui';
import { Inject } from '@wendellhu/redi';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { getPatternPreview } from '../utils/pattern';

@OnLifecycle(LifecycleStages.Rendered, NumfmtCellContent)
export class NumfmtCellContent extends Disposable {
    constructor(
        @Inject(SheetInterceptorService) private _sheetInterceptorService: SheetInterceptorService,
        @Inject(ThemeService) private _themeService: ThemeService,
        @Inject(SheetSkeletonManagerService) private _sheetSkeletonManagerService: SheetSkeletonManagerService,
        @Inject(ICommandService) private _commandService: ICommandService,

        @Inject(INumfmtService) private _numfmtService: INumfmtService,
        @Inject(LocaleService) private _localeService: LocaleService
    ) {
        super();
        this._initInterceptorCellContent();
    }

    private _initInterceptorCellContent() {
        const renderCache = new ObjectMatrix<{ result: ICellData; parameters: string | number }>();
        this.disposeWithMe(
            this._sheetInterceptorService.intercept(INTERCEPTOR_POINT.CELL_CONTENT, {
                handler: (cell, location, next) => {
                    const unitId = location.unitId;
                    const sheetId = location.subUnitId;
                    const numfmtValue = this._numfmtService.getValue(unitId, sheetId, location.row, location.col);
                    if (!numfmtValue) {
                        return next(cell);
                    }
                    const originCellValue = cell;
                    if (!originCellValue) {
                        return next(cell);
                    }
                    // just handle number
                    if (originCellValue.t !== CellValueType.NUMBER) {
                        return next(cell);
                    }

                    let numfmtRes: string = '';
                    const cache = renderCache.getValue(location.row, location.col);
                    if (cache && cache.parameters === originCellValue.v) {
                        return next({ ...cell, ...cache.result });
                    }

                    const info = getPatternPreview(numfmtValue.pattern, Number(originCellValue.v), this._localeService.getCurrentLocale());

                    numfmtRes = info.result;

                    if (!numfmtRes) {
                        return next(cell);
                    }

                    const res: ICellDataForSheetInterceptor = { v: numfmtRes };

                    if (info.color) {
                        const color = this._themeService.getCurrentTheme()[`${info.color}500`];

                        if (color) {
                            res.interceptorStyle = { cl: { rgb: color } };
                        }
                    }

                    renderCache.setValue(location.row, location.col, {
                        result: res,
                        parameters: originCellValue.v as number,
                    });
                    return next({ ...cell, ...res });
                },
            })
        );
        this.disposeWithMe(
            this._commandService.onCommandExecuted((commandInfo) => {
                if (commandInfo.id === SetNumfmtMutation.id) {
                    const params = commandInfo.params as ISetNumfmtMutationParams;
                    Object.keys(params.values).forEach((key) => {
                        const v = params.values[key];
                        v.ranges.forEach((range) => {
                            Range.foreach(range, (row, col) => {
                                renderCache.realDeleteValue(row, col);
                            });
                        });
                    });
                }
            })
        );
        this.disposeWithMe(
            toDisposable(
                this._sheetSkeletonManagerService.currentSkeleton$
                    .pipe(
                        map((skeleton) => skeleton?.sheetId),
                        distinctUntilChanged()
                    )
                    .subscribe(() => {
                        renderCache.reset();
                    })
            )
        );
    }
}
