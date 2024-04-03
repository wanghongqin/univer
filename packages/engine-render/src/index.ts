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

export * from './base-object';
export * from './basics';
export * from './canvas';
export * from './components';
export * from './context';
export * from './custom';
export * from './engine';
export * from './group';
export * from './layer';
export { IRenderingEngine, UniverRenderEnginePlugin } from './render-engine';
export * from './render-manager.service';
export * from './scene';
export * from './scene-viewer';
export * from './scroll-timer';
export * from './shape';
export * from './viewport';

// doc
export { DocumentViewModel } from './components/docs/view-model/document-view-model';
export { getAnchorBounding, TEXT_RANGE_LAYER_INDEX, TextRange } from './components/docs/text-selection/text-range';
export { NodePositionConvertToCursor } from './components/docs/text-selection/convert-cursor';
export { Liquid } from './components/docs/liquid';
export {
    ITextSelectionRenderManager,
    TextSelectionRenderManager,
    getCanvasOffsetByEngine,
} from './components/docs/text-selection/text-selection-render-manager';
export type { IActiveTextRange, IEditorInputConfig, ITextSelectionInnerParam } from './components/docs/text-selection/text-selection-render-manager';
export { Documents } from './components/docs/document';
export type { IPageRenderConfig } from './components/docs/document';
export { DocumentSkeleton } from './components/docs/layout/doc-skeleton';
