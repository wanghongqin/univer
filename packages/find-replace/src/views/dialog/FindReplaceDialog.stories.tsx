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

import type { Meta } from '@storybook/react';
import type { Dependency } from '@wendellhu/redi';
import { RediContext } from '@wendellhu/redi/react-bindings';
import React, { useContext, useState } from 'react';

import { DesktopLayoutService, ILayoutService } from '@univerjs/ui';
import { LocaleService, LocaleType } from '@univerjs/core';
import { FindReplaceService, IFindReplaceService } from '../../services/find-replace.service';
import { FindReplaceController } from '../../controllers/find-replace.controller';
import { enUS, zhCN } from '../../locale';
import { FindReplaceDialog } from './FindReplaceDialog';

const meta: Meta = {
    title: 'Find Replace Dialog',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

function FindDialogDemo() {
    const { injector } = useContext(RediContext);

    const [inject] = useState(() => {
        const deps: Dependency[] = [
            [IFindReplaceService, { useClass: FindReplaceService }],
            [ILayoutService, { useClass: DesktopLayoutService }],
            [FindReplaceController],
        ];

        injector?.get(LocaleService).load({
            [LocaleType.EN_US]: enUS,
            [LocaleType.ZH_CN]: zhCN,
        });

        deps.forEach((dependency) => injector?.add(dependency));

        return injector;
    });

    return (
        <RediContext.Provider value={{ injector: inject }}>
            <FindReplaceDialog />
        </RediContext.Provider>
    );
}

export const FindDialog = {
    render() {
        return <FindDialogDemo />;
    },
};

function ReplaceDialogDemo() {
    const { injector } = useContext(RediContext);

    const [inject] = useState(() => {
        const deps: Dependency[] = [
            [IFindReplaceService, { useClass: FindReplaceService }],
            [ILayoutService, { useClass: DesktopLayoutService }],
            [FindReplaceController],
        ];

        injector?.get(LocaleService).load({
            [LocaleType.EN_US]: enUS,
            [LocaleType.ZH_CN]: zhCN,
        });

        deps.forEach((dependency) => injector?.add(dependency));

        return injector;
    });

    return (
        <RediContext.Provider value={{ injector: inject }}>
            <FindReplaceDialog />
        </RediContext.Provider>
    );
}

export const ReplaceDialog = {
    render() {
        return <ReplaceDialogDemo />;
    },
};
