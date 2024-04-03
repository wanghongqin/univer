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

import type { IUniverInstanceService, Nullable } from '@univerjs/core';
import type {
    Engine,
    IRenderManagerService,
    Rect,
    Scene,
    Spreadsheet,
    SpreadsheetColumnHeader,
    SpreadsheetHeader,
    SpreadsheetSkeleton,
    Viewport,
} from '@univerjs/engine-render';
import { Vector2 } from '@univerjs/engine-render';

import { SHEET_VIEW_KEY, VIEWPORT_KEY } from '../../common/keys';

export interface ISheetObjectParam {
    spreadsheet: Spreadsheet;
    spreadsheetRowHeader: SpreadsheetHeader;
    spreadsheetColumnHeader: SpreadsheetColumnHeader;
    spreadsheetLeftTopPlaceholder: Rect;
    scene: Scene;
    engine: Engine;
}

export function getSheetObject(
    univerInstanceService: IUniverInstanceService,
    renderManagerService: IRenderManagerService
): Nullable<ISheetObjectParam> {
    const workbook = univerInstanceService.getCurrentUniverSheetInstance();

    const unitId = workbook.getUnitId();

    const currentRender = renderManagerService.getRenderById(unitId);

    if (currentRender == null) {
        return;
    }

    const { components, mainComponent, scene, engine } = currentRender;

    const spreadsheet = mainComponent as Spreadsheet;
    const spreadsheetRowHeader = components.get(SHEET_VIEW_KEY.ROW) as SpreadsheetHeader;
    const spreadsheetColumnHeader = components.get(SHEET_VIEW_KEY.COLUMN) as SpreadsheetColumnHeader;
    const spreadsheetLeftTopPlaceholder = components.get(SHEET_VIEW_KEY.LEFT_TOP) as Rect;

    return {
        spreadsheet,
        spreadsheetRowHeader,
        spreadsheetColumnHeader,
        spreadsheetLeftTopPlaceholder,
        scene,
        engine,
    };
}

export function getCoordByCell(row: number, col: number, scene: Scene, skeleton: SpreadsheetSkeleton) {
    const { startX, startY, endX, endY } = skeleton.getCellByIndex(row, col);
    return { startX, startY, endX, endY };
}

export function getCoordByOffset(
    evtOffsetX: number,
    evtOffsetY: number,
    scene: Scene,
    skeleton: SpreadsheetSkeleton,
    viewport?: Viewport
) {
    const relativeCoords = scene.getRelativeCoord(Vector2.FromArray([evtOffsetX, evtOffsetY]));

    const { x: newEvtOffsetX, y: newEvtOffsetY } = relativeCoords;

    const scrollXY = scene.getScrollXYByRelativeCoords(relativeCoords, viewport);

    const { scaleX, scaleY } = scene.getAncestorScale();

    const moveActualSelection = skeleton.getCellPositionByOffset(
        newEvtOffsetX,
        newEvtOffsetY,
        scaleX,
        scaleY,
        scrollXY
    );

    const { row, column } = moveActualSelection;

    const startCell = skeleton.getNoMergeCellPositionByIndex(row, column);

    const { startX, startY, endX, endY } = startCell;

    return {
        startX,
        startY,
        endX,
        endY,
        row,
        column,
    };
}

export function getTransformCoord(evtOffsetX: number, evtOffsetY: number, scene: Scene, skeleton: SpreadsheetSkeleton) {
    const relativeCoords = scene.getRelativeCoord(Vector2.FromArray([evtOffsetX, evtOffsetY]));

    const viewMain = scene.getViewport(VIEWPORT_KEY.VIEW_MAIN);

    const scrollXY = scene.getScrollXYByRelativeCoords(relativeCoords, viewMain);
    const { scaleX, scaleY } = scene.getAncestorScale();

    const { x: scrollX, y: scrollY } = scrollXY;

    const offsetX = evtOffsetX / scaleX + scrollX;

    const offsetY = evtOffsetY / scaleY + scrollY;

    return { x: offsetX, y: offsetY };
}
