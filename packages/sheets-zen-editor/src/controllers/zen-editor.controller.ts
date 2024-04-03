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

import type { ICommandInfo, IParagraph, ITextRun } from '@univerjs/core';
import {
    DEFAULT_EMPTY_DOCUMENT_VALUE,
    DOCS_FORMULA_BAR_EDITOR_UNIT_ID_KEY,
    DOCS_NORMAL_EDITOR_UNIT_ID_KEY,
    ICommandService,
    IUndoRedoService,
    IUniverInstanceService,
    LifecycleStages,
    OnLifecycle,
    RxDisposable,
} from '@univerjs/core';
import type { IDocObjectParam, IRichTextEditingMutationParams } from '@univerjs/docs';
import {
    DocSkeletonManagerService,
    DocViewModelManagerService,
    getDocObject,
    RichTextEditingMutation,
    TextSelectionManagerService,
    VIEWPORT_KEY,
} from '@univerjs/docs';
import { DeviceInputEventType, IRenderManagerService } from '@univerjs/engine-render';
import { getEditorObject, IEditorBridgeService } from '@univerjs/sheets-ui';
import type { IEditorBridgeServiceParam } from '@univerjs/sheets-ui';
import { IZenZoneService } from '@univerjs/ui';
import { Inject } from '@wendellhu/redi';
import { takeUntil } from 'rxjs';

import { OpenZenEditorOperation } from '../commands/operations/zen-editor.operation';
import { IZenEditorManagerService } from '../services/zen-editor.service';

export const DOCS_ZEN_EDITOR_UNIT_ID_KEY = '__defaultDocumentZenEditorSpecialUnitId_20231218__';

@OnLifecycle(LifecycleStages.Steady, ZenEditorController)
export class ZenEditorController extends RxDisposable {
    constructor(
        @IUniverInstanceService private readonly _currentUniverService: IUniverInstanceService,
        @IZenEditorManagerService private readonly _zenEditorManagerService: IZenEditorManagerService,
        @IRenderManagerService private readonly _renderManagerService: IRenderManagerService,
        @ICommandService private readonly _commandService: ICommandService,
        @IZenZoneService private readonly _zenZoneService: IZenZoneService,
        @IEditorBridgeService private readonly _editorBridgeService: IEditorBridgeService,
        @IUndoRedoService private readonly _undoRedoService: IUndoRedoService,
        @Inject(TextSelectionManagerService) private readonly _textSelectionManagerService: TextSelectionManagerService,
        @Inject(DocSkeletonManagerService) private readonly _docSkeletonManagerService: DocSkeletonManagerService,
        @Inject(DocViewModelManagerService) private readonly _docViewModelManagerService: DocViewModelManagerService
    ) {
        super();

        this._initialize();
    }

    private _initialize() {
        this._syncZenEditorSize();

        this._commandExecutedListener();

        // this._createZenEditorInstance();
    }

    private _createZenEditorInstance() {
        // create univer doc formula bar editor instance
        const INITIAL_SNAPSHOT = {
            id: DOCS_ZEN_EDITOR_UNIT_ID_KEY,
            body: {
                dataStream: `${DEFAULT_EMPTY_DOCUMENT_VALUE}`,
                textRuns: [],
                paragraphs: [
                    {
                        startIndex: 0,
                    },
                ],
            },
            documentStyle: {
                pageSize: {
                    width: 595,
                    height: 842,
                },
                marginTop: 50,
                marginBottom: 50,
                marginRight: 40,
                marginLeft: 40,
                renderConfig: {
                    vertexAngle: 0,
                    centerAngle: 0,
                },
            },
        };

        this._currentUniverService.createDoc(INITIAL_SNAPSHOT);
    }

    // Listen to changes in the size of the zen editor container to set the size of the editor.
    private _syncZenEditorSize() {
        this._zenEditorManagerService.position$.pipe(takeUntil(this.dispose$)).subscribe((position) => {
            if (position == null) {
                return;
            }

            const editorObject = getEditorObject(DOCS_ZEN_EDITOR_UNIT_ID_KEY, this._renderManagerService);
            const zenEditorDataModel = this._currentUniverService.getUniverDocInstance(DOCS_ZEN_EDITOR_UNIT_ID_KEY);

            if (editorObject == null || zenEditorDataModel == null) {
                return;
            }

            const { width, height } = position;

            const { engine } = editorObject;

            const skeleton = this._docSkeletonManagerService.getSkeletonByUnitId(DOCS_ZEN_EDITOR_UNIT_ID_KEY)?.skeleton;

            // Update page size when container resized.
            // zenEditorDataModel.updateDocumentDataPageSize(width);

            // resize canvas
            requestIdleCallback(() => {
                engine.resizeBySize(width, height);

                this._calculatePagePosition(editorObject);

                if (skeleton) {
                    this._textSelectionManagerService.refreshSelection();
                }
            });
        });
    }

    private _zenEditorInitialState = false;

    private _handleOpenZenEditor() {
        if (!this._zenEditorInitialState) {
            this._createZenEditorInstance();
            this._zenEditorInitialState = true;
        }

        this._zenZoneService.open();

        // Need to clear undo/redo service when open zen mode.
        this._undoRedoService.clearUndoRedo(DOCS_ZEN_EDITOR_UNIT_ID_KEY);

        this._currentUniverService.focusUniverInstance(DOCS_ZEN_EDITOR_UNIT_ID_KEY);

        this._currentUniverService.setCurrentUniverDocInstance(DOCS_ZEN_EDITOR_UNIT_ID_KEY);

        const visibleState = this._editorBridgeService.isVisible();
        if (visibleState.visible === false) {
            this._editorBridgeService.changeVisible({
                visible: true,
                eventType: DeviceInputEventType.PointerDown,
            });
        }

        const editCellState = this._editorBridgeService.getLatestEditCellState();

        if (editCellState == null) {
            return;
        }

        this._editorSyncHandler(editCellState);

        const textRanges = [
            {
                startOffset: 0,
                endOffset: 0,
            },
        ];

        this._textSelectionManagerService.replaceTextRanges(textRanges);
    }

    private _editorSyncHandler(param: IEditorBridgeServiceParam) {
        const body = param.documentLayoutObject.documentModel?.getBody();

        const dataStream = body?.dataStream;
        const paragraphs = body?.paragraphs;
        let textRuns: ITextRun[] = [];

        if (dataStream == null || paragraphs == null) {
            return;
        }

        if (body?.textRuns?.length) {
            textRuns = body?.textRuns;
        }

        this._syncContentAndRender(DOCS_ZEN_EDITOR_UNIT_ID_KEY, dataStream, paragraphs, textRuns);

        // Also need to resize document and scene after sync content.
        // this._autoScroll();
    }

    private _syncContentAndRender(
        unitId: string,
        dataStream: string,
        paragraphs: IParagraph[],
        textRuns: ITextRun[] = []
    ) {
        const INCLUDE_LIST = [
            DOCS_ZEN_EDITOR_UNIT_ID_KEY,
            DOCS_NORMAL_EDITOR_UNIT_ID_KEY,
            DOCS_FORMULA_BAR_EDITOR_UNIT_ID_KEY,
        ];

        const docsSkeletonObject = this._docSkeletonManagerService.getSkeletonByUnitId(unitId);
        const docDataModel = this._currentUniverService.getUniverDocInstance(unitId);
        const docViewModel = this._docViewModelManagerService.getViewModel(unitId);

        if (docDataModel == null || docViewModel == null || docsSkeletonObject == null) {
            return;
        }

        const docBody = docDataModel.getBody()!;

        docBody.dataStream = dataStream;
        docBody.paragraphs = paragraphs;

        // Need to empty textRuns(previous formula highlight) every time when sync content(change selection or edit cell or edit formula bar).
        if (unitId === DOCS_FORMULA_BAR_EDITOR_UNIT_ID_KEY) {
            docBody.textRuns = [];
        }

        if (textRuns.length > 0) {
            docBody.textRuns = textRuns;
        }

        docViewModel.reset(docDataModel);

        const { skeleton } = docsSkeletonObject;

        const currentRender = this._getDocObject();

        if (currentRender == null) {
            return;
        }

        skeleton.calculate();

        if (INCLUDE_LIST.includes(unitId)) {
            currentRender.document.makeDirty();
        }
    }

    private _calculatePagePosition(currentRender: IDocObjectParam) {
        const { document: docsComponent, scene } = currentRender;

        const parent = scene?.getParent();

        const { width: docsWidth, height: docsHeight, pageMarginLeft, pageMarginTop } = docsComponent;
        if (parent == null || docsWidth === Number.POSITIVE_INFINITY || docsHeight === Number.POSITIVE_INFINITY) {
            return;
        }
        const { width: engineWidth, height: engineHeight } = parent;

        let docsLeft = 0;
        let docsTop = 0;

        let sceneWidth = 0;

        let sceneHeight = 0;

        let scrollToX = Number.POSITIVE_INFINITY;

        const { scaleX, scaleY } = scene.getAncestorScale();

        if (engineWidth > (docsWidth + pageMarginLeft * 2) * scaleX) {
            docsLeft = engineWidth / 2 - (docsWidth * scaleX) / 2;
            docsLeft /= scaleX;
            sceneWidth = (engineWidth - pageMarginLeft * 2) / scaleX;

            scrollToX = 0;
        } else {
            docsLeft = pageMarginLeft;
            sceneWidth = docsWidth + pageMarginLeft * 2;

            scrollToX = (sceneWidth - engineWidth / scaleX) / 2;
        }

        if (engineHeight > docsHeight) {
            docsTop = engineHeight / 2 - docsHeight / 2;
            sceneHeight = (engineHeight - pageMarginTop * 2) / scaleY;
        } else {
            docsTop = pageMarginTop;
            sceneHeight = docsHeight + pageMarginTop * 2;
        }

        scene.resize(sceneWidth, sceneHeight + 200);

        docsComponent.translate(docsLeft, docsTop);

        const viewport = scene.getViewport(VIEWPORT_KEY.VIEW_MAIN);
        if (scrollToX !== Number.POSITIVE_INFINITY && viewport != null) {
            const actualX = viewport.getBarScroll(scrollToX, 0).x;
            viewport.scrollTo({
                x: actualX,
            });
        }

        return this;
    }

    private _commandExecutedListener() {
        const updateCommandList = [OpenZenEditorOperation.id];

        this.disposeWithMe(
            this._commandService.onCommandExecuted((command: ICommandInfo) => {
                if (updateCommandList.includes(command.id)) {
                    this._handleOpenZenEditor();
                }
            })
        );

        const editCommandList = [RichTextEditingMutation.id];

        this.disposeWithMe(
            this._commandService.onCommandExecuted((command: ICommandInfo) => {
                if (editCommandList.includes(command.id)) {
                    const params = command.params as IRichTextEditingMutationParams;
                    const { unitId } = params;

                    if (unitId === DOCS_ZEN_EDITOR_UNIT_ID_KEY) {
                        // sync cell content to formula editor bar when edit cell editor and vice verse.
                        const editorDocDataModel = this._currentUniverService.getUniverDocInstance(unitId);
                        const docBody = editorDocDataModel?.getBody();
                        const dataStream = docBody?.dataStream;
                        const paragraphs = docBody?.paragraphs;
                        const textRuns = docBody?.textRuns;

                        /**
                         * Fix the issue where content cannot be saved in the doc under Zen mode.
                         */
                        this._editorBridgeService.changeEditorDirty(true);

                        if (dataStream == null || paragraphs == null) {
                            return;
                        }

                        this._syncContentAndRender(DOCS_NORMAL_EDITOR_UNIT_ID_KEY, dataStream, paragraphs, textRuns);
                    }
                }
            })
        );
    }

    private _getDocObject() {
        return getDocObject(this._currentUniverService, this._renderManagerService);
    }
}
