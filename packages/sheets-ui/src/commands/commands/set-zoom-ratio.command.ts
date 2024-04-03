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

import type { ICommand } from '@univerjs/core';
import { CommandType, ICommandService, IUniverInstanceService } from '@univerjs/core';

import { SHEET_ZOOM_RANGE } from '../../common/keys';
import { SetZoomRatioOperation } from '../operations/set-zoom-ratio.operation';

export interface ISetZoomRatioCommandParams {
    zoomRatio: number;
    unitId: string;
    subUnitId: string;
}
export interface IChangeZoomRatioCommandParams {
    reset?: boolean;
    delta: number;
}

/**
 * Zoom
 */

export const ChangeZoomRatioCommand: ICommand<IChangeZoomRatioCommandParams> = {
    id: 'sheet.command.change-zoom-ratio',
    type: CommandType.COMMAND,
    handler: async (accessor, params) => {
        if (!params) {
            return false;
        }
        const { delta, reset } = params;
        const workbook = accessor.get(IUniverInstanceService).getCurrentUniverSheetInstance();
        const worksheet = workbook.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();

        let zoom = reset ? 100 : Math.round((worksheet.getConfig().zoomRatio + delta) * 100);
        zoom = Math.max(SHEET_ZOOM_RANGE[0], zoom);
        zoom = Math.min(SHEET_ZOOM_RANGE[1], zoom);

        const zoomRatio = zoom / 100;

        return accessor.get(ICommandService).executeCommand(SetZoomRatioOperation.id, {
            unitId,
            subUnitId,
            zoomRatio,
        });
    },
};

export const SetZoomRatioCommand: ICommand<ISetZoomRatioCommandParams> = {
    id: 'sheet.command.set-zoom-ratio',
    type: CommandType.COMMAND,
    handler: async (accessor, params) => {
        if (!params) {
            return false;
        }
        const { unitId, subUnitId, zoomRatio } = params;

        return accessor.get(ICommandService).executeCommand(SetZoomRatioOperation.id, {
            unitId,
            subUnitId,
            zoomRatio,
        });
    },
};
