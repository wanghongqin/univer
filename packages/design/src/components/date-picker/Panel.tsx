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

import React, { useContext } from 'react';
import type { Dayjs } from 'dayjs';
import generateConfig from 'rc-picker/lib/generate/dayjs';
import type { BasePickerPanelProps } from 'rc-picker';
import { PickerPanel } from 'rc-picker';
import { ConfigContext } from '../config-provider';
import styles from './index.module.less';

export type DatePanelProps = Omit<BasePickerPanelProps<Dayjs>, 'prefixCls' | 'locale' | 'generateConfig'>;

export const DatePanel = (props: DatePanelProps) => {
    const { locale } = useContext(ConfigContext);
    return (
        <PickerPanel
            {...props}
            generateConfig={generateConfig}
            prefixCls={styles.datePicker}
            locale={locale.design.Picker}
        />
    );
};
