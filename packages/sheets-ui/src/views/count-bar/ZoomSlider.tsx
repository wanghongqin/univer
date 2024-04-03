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

import {
    ICommandService,
    IUniverInstanceService,
} from '@univerjs/core';
import { Slider } from '@univerjs/design';
import { SetWorksheetActivateCommand } from '@univerjs/sheets';
import { useDependency } from '@wendellhu/redi/react-bindings';
import React, { useCallback, useEffect, useState } from 'react';

import { SetZoomRatioCommand } from '../../commands/commands/set-zoom-ratio.command';
import { SetZoomRatioOperation } from '../../commands/operations/set-zoom-ratio.operation';
import { SHEET_ZOOM_RANGE } from '../../common/keys';

const ZOOM_MAP = [50, 80, 100, 130, 150, 170, 200, 400];

export function ZoomSlider() {
    const commandService = useDependency(ICommandService);
    const univerInstanceService = useDependency(IUniverInstanceService);

    const getCurrentZoom = useCallback(() => {
        const currentZoom = univerInstanceService.getCurrentUniverSheetInstance().getActiveSheet().getZoomRatio() * 100 || 100;
        return Math.round(currentZoom);
    }, [univerInstanceService]);

    const [zoom, setZoom] = useState(() => getCurrentZoom());

    useEffect(() => {
        const disposable = commandService.onCommandExecuted((commandInfo) => {
            if (commandInfo.id === SetZoomRatioOperation.id || commandInfo.id === SetWorksheetActivateCommand.id) {
                const currentZoom = getCurrentZoom();
                setZoom(currentZoom);
            }
        });
        return disposable.dispose;
    }, [commandService, getCurrentZoom]);

    function handleChange(value: number) {
        setZoom(value);
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const worksheet = workbook?.getActiveSheet();
        if (worksheet == null) {
            return;
        }

        const zoomRatio = value / 100;

        commandService.executeCommand(SetZoomRatioCommand.id, {
            unitId: workbook.getUnitId(),
            subUnitId: worksheet.getSheetId(),
            zoomRatio,
        });
    }

    return (
        <Slider
            min={SHEET_ZOOM_RANGE[0]}
            value={zoom}
            shortcuts={ZOOM_MAP}
            onChange={handleChange}
        />
    );
}
