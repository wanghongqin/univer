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

import { Button } from '../button/Button';
import { ConfigContext } from '../config-provider/ConfigProvider';
import { Dialog } from '../dialog/Dialog';
import styles from './index.module.less';

export interface IConfirmProps {
    children: React.ReactNode;

    /**
     * Whether the Confirm is visible.
     * @default false
     */
    visible?: boolean;

    /**
     * The title of the Confirm.
     */
    title?: React.ReactNode;

    /**
     * The text of the Confirm's confirm button.
     */
    cancelText?: string;

    /**
     * The text of the Confirm's cancel button.
     */
    confirmText?: string;

    /**
     * Callback when the Confirm is closed.
     */
    onClose?: () => void;

    /**
     * Callback when the Confirm is confirmed.
     */
    onConfirm?: () => void;
}

export function Confirm(props: IConfirmProps) {
    const { children, visible = false, title, cancelText, confirmText, onClose, onConfirm } = props;

    const { locale } = useContext(ConfigContext);

    function Footer() {
        return (
            <footer className={styles.confirmFooter}>
                <Button onClick={onClose}>{cancelText ?? locale.design.Confirm.cancel}</Button>
                <Button type="primary" onClick={onConfirm}>
                    {confirmText ?? locale.design.Confirm.confirm}
                </Button>
            </footer>
        );
    }

    return (
        <Dialog visible={visible} title={title} footer={<Footer />} onClose={onClose}>
            {children}
        </Dialog>
    );
}
