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

import { Disposable, type Nullable, type Observer, toDisposable } from '@univerjs/core';

import type { BaseObject } from './base-object';
import { RENDER_CLASS_TYPE } from './basics/const';
import type { IEvent, IKeyboardEvent, IMouseEvent, IPointerEvent, IWheelEvent } from './basics/i-events';
import { DeviceType, PointerInput } from './basics/i-events';
import { Vector2 } from './basics/vector2';
import type { ThinScene } from './thin-scene';
import type { Viewport } from './viewport';

export class InputManager extends Disposable {
    /** The distance in pixel that you have to move to prevent some events */
    static DragMovementThreshold = 2; // in pixels

    /** Time in milliseconds to wait to raise long press events if button is still pressed */
    static LongPressDelay = 500; // in milliseconds

    /** Time in milliseconds with two consecutive clicks will be considered as a double or triple click */
    static DoubleClickDelay = 500; // in milliseconds

    static TripleClickDelay = 300; // in milliseconds

    /** If you need to check double click without raising a single click at first click, enable this flag */
    static ExclusiveDoubleClickMode = false;

    /** This is a defensive check to not allow control attachment prior to an already active one. If already attached, previous control is unattached before attaching the new one. */
    private _alreadyAttached = false;

    // private _alreadyAttachedTo: HTMLElement;

    // WorkBookObserver
    private _onInputObserver: Nullable<Observer<IEvent>>;

    // Pointers
    private _onPointerMove!: (evt: IMouseEvent) => void;

    private _onPointerDown!: (evt: IPointerEvent) => void;

    private _onPointerUp!: (evt: IPointerEvent) => void;

    private _onPointerEnter!: (evt: IPointerEvent) => void;

    private _onPointerLeave!: (evt: IPointerEvent) => void;

    private _onMouseWheel!: (evt: IWheelEvent) => void;

    // Keyboard
    private _onKeyDown!: (evt: IKeyboardEvent) => void;

    private _onKeyUp!: (evt: IKeyboardEvent) => void;

    private _scene!: ThinScene;

    private _currentMouseEnterPicked: Nullable<BaseObject | ThinScene>;

    private _startingPosition = new Vector2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);

    private _delayedTimeout: NodeJS.Timeout | number = -1;

    private _delayedTripeTimeout: NodeJS.Timeout | number = -1;

    private _doubleClickOccurred = 0;

    private _tripleClickState = false;

    private _currentObject: Nullable<BaseObject | ThinScene>;

    constructor(scene: ThinScene) {
        super();
        this._scene = scene;
    }

    // Handle events such as triggering mouseleave and mouseenter.
    mouseLeaveEnterHandler(evt: IMouseEvent) {
        const o = this._currentObject;
        if (o === null || o === undefined) {
            this._currentMouseEnterPicked?.triggerPointerLeave(evt);
            this._currentMouseEnterPicked = null;
        } else if (o !== this._currentMouseEnterPicked) {
            const previousPicked = this._currentMouseEnterPicked;
            this._currentMouseEnterPicked = o;
            previousPicked?.triggerPointerLeave(evt);
            o?.triggerPointerEnter(evt);
        }
    }

    attachControl(
        hasDown: boolean = true,
        hasUp: boolean = true,
        hasMove: boolean = true,
        hasWheel: boolean = true,
        hasEnter: boolean = true,
        hasLeave: boolean = true
    ) {
        const engine = this._scene.getEngine();

        if (!engine) {
            return;
        }

        this._onPointerEnter = (evt: IMouseEvent) => {
            // preserve compatibility with Safari when pointerId is not present
            if ((evt as IPointerEvent).pointerId === undefined) {
                (evt as IPointerEvent as any).pointerId = 0;
            }

            this._currentObject = this._getCurrentObject(evt.offsetX, evt.offsetY);
            const isStop = this._currentObject?.triggerPointerMove(evt);

            this.mouseLeaveEnterHandler(evt);

            // if (this._checkDirectSceneEventTrigger(!isStop, this._currentObject)) {
            //     if (this._scene.onPointerMoveObserver.hasObservers()) {
            //         this._scene.onPointerMoveObserver.notifyObservers(evt);
            //     }
            // }
        };

        this._onPointerLeave = (evt: IMouseEvent) => {
            // preserve compatibility with Safari when pointerId is not present
            if ((evt as IPointerEvent).pointerId === undefined) {
                (evt as IPointerEvent as any).pointerId = 0;
            }

            // this._currentObject = this._getCurrentObject(evt.offsetX, evt.offsetY);
            // const isStop = this._currentObject?.triggerPointerMove(evt);

            this._currentObject = null;

            this.mouseLeaveEnterHandler(evt);

            // if (this._checkDirectSceneEventTrigger(!isStop, this._currentObject)) {
            //     if (this._scene.onPointerMoveObserver.hasObservers()) {
            //         this._scene.onPointerMoveObserver.notifyObservers(evt);
            //     }
            // }
        };

        this._onPointerMove = (evt: IMouseEvent) => {
            // preserve compatibility with Safari when pointerId is not present
            if ((evt as IPointerEvent).pointerId === undefined) {
                (evt as IPointerEvent as any).pointerId = 0;
            }

            this._currentObject = this._getCurrentObject(evt.offsetX, evt.offsetY);
            const isStop = this._currentObject?.triggerPointerMove(evt);

            this.mouseLeaveEnterHandler(evt);

            if (this._checkDirectSceneEventTrigger(!isStop, this._currentObject)) {
                if (this._scene.onPointerMoveObserver.hasObservers()) {
                    this._scene.onPointerMoveObserver.notifyObservers(evt);
                }
            }
        };

        this._onPointerDown = (evt: IPointerEvent) => {
            // preserve compatibility with Safari when pointerId is not present
            if (evt.pointerId === undefined) {
                (evt as any).pointerId = 0;
            }

            const currentObject = this._getCurrentObject(evt.offsetX, evt.offsetY);

            const isStop = currentObject?.triggerPointerDown(evt);

            if (this._checkDirectSceneEventTrigger(!isStop, currentObject)) {
                // if (this._scene.onPointerDown) {
                //     this._scene.onPointerDown(evt);
                // }

                if (this._scene.onPointerDownObserver.hasObservers()) {
                    this._scene.onPointerDownObserver.notifyObservers(evt);
                }
            }
        };

        this._onPointerUp = (evt: IPointerEvent) => {
            // preserve compatibility with Safari when pointerId is not present
            if (evt.pointerId === undefined) {
                evt.pointerId = 0;
            }

            const currentObject = this._getCurrentObject(evt.offsetX, evt.offsetY);
            const isStop = currentObject?.triggerPointerUp(evt);

            if (this._checkDirectSceneEventTrigger(!isStop, currentObject)) {
                if (this._scene.onPointerUpObserver.hasObservers()) {
                    this._scene.onPointerUpObserver.notifyObservers(evt);
                }
            }

            this._prePointerDoubleOrTripleClick(evt);
        };

        this._onMouseWheel = (evt: IWheelEvent) => {
            const currentObject = this._getCurrentObject(evt.offsetX, evt.offsetY);
            const isStop = currentObject?.triggerMouseWheel(evt);

            this._scene.getViewports().forEach((vp: Viewport) => {
                if (vp.onMouseWheelObserver.hasObservers()) {
                    vp.onMouseWheelObserver.notifyObservers(evt);
                }
            });

            if (this._checkDirectSceneEventTrigger(!isStop, currentObject)) {
                if (this._scene.onMouseWheelObserver.hasObservers()) {
                    this._scene.onMouseWheelObserver.notifyObservers(evt);
                }
            }
        };

        this._onKeyDown = (evt: IKeyboardEvent) => {
            if (this._scene.onKeyDownObservable.hasObservers()) {
                this._scene.onKeyDownObservable.notifyObservers(evt);
            }
        };

        this._onKeyUp = (evt: IKeyboardEvent) => {
            if (this._scene.onKeyUpObservable.hasObservers()) {
                this._scene.onKeyUpObservable.notifyObservers(evt);
            }
        };

        this._onInputObserver = engine.onInputChangedObservable.add((eventData: IEvent) => {
            const evt: IEvent = eventData;
            // Keyboard Events
            if (eventData.deviceType === DeviceType.Keyboard) {
                if (eventData.currentState === 1) {
                    this._onKeyDown(evt as IKeyboardEvent);
                }

                if (eventData.currentState === 0) {
                    this._onKeyUp(evt as IKeyboardEvent);
                }
            }

            // Pointer Events
            if (eventData.deviceType === DeviceType.Mouse || eventData.deviceType === DeviceType.Touch) {
                if (
                    hasDown &&
                    eventData.inputIndex >= PointerInput.LeftClick &&
                    eventData.inputIndex <= PointerInput.RightClick &&
                    eventData.currentState === 1
                ) {
                    this._onPointerDown(evt as IPointerEvent);
                }

                if (
                    hasUp &&
                    eventData.inputIndex >= PointerInput.LeftClick &&
                    eventData.inputIndex <= PointerInput.RightClick &&
                    eventData.currentState === 0
                ) {
                    this._onPointerUp(evt as IPointerEvent);
                }

                if (
                    hasMove &&
                    (eventData.inputIndex === PointerInput.Horizontal ||
                        eventData.inputIndex === PointerInput.Vertical ||
                        eventData.inputIndex === PointerInput.DeltaHorizontal ||
                        eventData.inputIndex === PointerInput.DeltaVertical)
                ) {
                    this._onPointerMove(evt as IPointerEvent);
                } else if (
                    hasWheel &&
                    (eventData.inputIndex === PointerInput.MouseWheelX ||
                        eventData.inputIndex === PointerInput.MouseWheelY ||
                        eventData.inputIndex === PointerInput.MouseWheelZ)
                ) {
                    this._onMouseWheel(evt as IWheelEvent);
                } else if (hasEnter && eventData.currentState === 2) {
                    // this._onPointerUp(evt as IPointerEvent);
                    this._onPointerEnter(evt as IPointerEvent);
                } else if (hasLeave && eventData.currentState === 3) {
                    // this._onPointerUp(evt as IPointerEvent);
                    this._onPointerLeave(evt as IPointerEvent);
                }
            }
        });

        this.disposeWithMe(
            toDisposable(
                this._onInputObserver
            )
        );

        this._alreadyAttached = true;
    }

    /**
     * Detaches all event handlers
     */
    detachControl() {
        if (!this._alreadyAttached) {
            return;
        }

        const engine = this._scene.getEngine();

        if (!engine) {
            return;
        }
        engine.onInputChangedObservable.remove(this._onInputObserver);

        this._alreadyAttached = false;
    }

    private _getCurrentObject(offsetX: number, offsetY: number) {
        return this._scene?.pick(Vector2.FromArray([offsetX, offsetY]));
    }

    private _checkDirectSceneEventTrigger(isTrigger: boolean, currentObject: Nullable<ThinScene | BaseObject>) {
        let notObject = false;
        if (currentObject == null) {
            notObject = true;
        }

        let isNotInSceneViewer = true;
        if (currentObject && currentObject.classType === RENDER_CLASS_TYPE.BASE_OBJECT) {
            const scene = (currentObject as BaseObject).getScene() as ThinScene;
            if (scene) {
                const parent = scene.getParent();
                isNotInSceneViewer = parent.classType !== RENDER_CLASS_TYPE.SCENE_VIEWER;
            }
        }
        return (!this._scene.evented && isTrigger && isNotInSceneViewer) || notObject;
    }

    /**
     * @hidden
     * @returns Boolean if delta for pointer exceeds drag movement threshold
     */
    private _isPointerSwiping(pointerX: number, pointerY: number): boolean {
        return (
            Math.abs(this._startingPosition.x - pointerX) > InputManager.DragMovementThreshold ||
            Math.abs(this._startingPosition.y - pointerY) > InputManager.DragMovementThreshold
        );
    }

    private _prePointerDoubleOrTripleClick(evt: IPointerEvent) {
        const { clientX, clientY } = evt;

        const isMoveThreshold = this._isPointerSwiping(clientX, clientY);

        if (isMoveThreshold) {
            this._resetDoubleClickParam();
        }

        this._delayedTimeout = setTimeout(() => {
            this._resetDoubleClickParam();
        }, InputManager.DoubleClickDelay);

        this._doubleClickOccurred += 1;

        if (this._tripleClickState) {
            this._scene?.pick(Vector2.FromArray([evt.offsetX, evt.offsetY]))?.triggerTripleClick(evt);

            if (this._scene.onTripleClickObserver.hasObservers()) {
                this._scene.onTripleClickObserver.notifyObservers(evt);
            }
        }

        if (this._doubleClickOccurred === 2) {
            this._scene?.pick(Vector2.FromArray([evt.offsetX, evt.offsetY]))?.triggerDblclick(evt);

            if (this._scene.onDblclickObserver.hasObservers()) {
                this._scene.onDblclickObserver.notifyObservers(evt);
            }
            this._resetDoubleClickParam();
            this._tripleClickState = true;

            clearTimeout(this._delayedTripeTimeout);

            this._delayedTripeTimeout = setTimeout(() => {
                this._tripleClickState = false;
            }, InputManager.TripleClickDelay);
        }

        this._startingPosition.x = clientX;
        this._startingPosition.y = clientY;
    }

    private _resetDoubleClickParam() {
        this._doubleClickOccurred = 0;
        clearTimeout(this._delayedTimeout);
    }
}
