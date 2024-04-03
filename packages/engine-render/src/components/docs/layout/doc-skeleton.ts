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

import type { ISectionBreak, ISectionColumnProperties, LocaleService, Nullable } from '@univerjs/core';
import {
    ColumnSeparatorType,
    GridType,
    HorizontalAlign,
    PageOrientType,
    PRESET_LIST_TYPE,
    SectionType,
    VerticalAlign,
    WrapStrategy,
} from '@univerjs/core';

import type {
    IDocumentSkeletonCached,
    IDocumentSkeletonGlyph,
    IDocumentSkeletonPage,
    ISkeletonResourceReference,
} from '../../../basics/i-document-skeleton-cached';
import { GlyphType, LineType, PageLayoutType } from '../../../basics/i-document-skeleton-cached';
import type { IDocsConfig, INodeInfo, INodePosition, INodeSearch, ISectionBreakConfig } from '../../../basics/interfaces';
import type { IViewportBound, Vector2 } from '../../../basics/vector2';
import { Skeleton } from '../../skeleton';
import { Liquid } from '../liquid';
import type { DocumentViewModel } from '../view-model/document-view-model';
import { getLastPage, updateBlockIndex } from './tools';
import { createSkeletonSection } from './model/section';
import { dealWithSections } from './block/section';
import { createSkeletonPage } from './model/page';

const DEFAULT_SECTION_BREAK: ISectionBreak = {
    columnProperties: [],
    columnSeparatorType: ColumnSeparatorType.NONE,
    sectionType: SectionType.SECTION_TYPE_UNSPECIFIED,
    startIndex: 0,
};

export enum DocumentSkeletonState {
    PENDING = 'pending',
    CALCULATING = 'calculating',
    READY = 'ready',
    INVALID = 'invalid',
}

export class DocumentSkeleton extends Skeleton {
    private _skeletonData: Nullable<IDocumentSkeletonCached>;

    private _renderedBlockIdMap = new Map<string, boolean>();

    private _findLiquid: Liquid = new Liquid();

    constructor(
        private _docViewModel: DocumentViewModel,
        localeService: LocaleService
    ) {
        super(localeService);
    }

    static create(docViewModel: DocumentViewModel, localeService: LocaleService) {
        return new DocumentSkeleton(docViewModel, localeService);
    }

    getViewModel() {
        return this._docViewModel;
    }

    // Layout the document.
    calculate(bounds?: IViewportBound) {
        if (!this.dirty) {
            return;
        }

        this._skeletonData = this._createSkeleton(bounds);
    }

    getSkeletonData() {
        return this._skeletonData;
    }

    getActualSize() {
        const skeletonData = this.getSkeletonData();

        let actualWidth = Number.NEGATIVE_INFINITY;
        let actualHeight = 0;

        skeletonData?.pages.forEach((page) => {
            const { width, height } = page;
            actualWidth = Math.max(actualWidth, width);

            actualHeight += height;
        });

        return {
            actualWidth,
            actualHeight,
        };
    }

    private _getPageActualWidth(page: IDocumentSkeletonPage) {
        let maxWidth = Number.NEGATIVE_INFINITY;
        for (const section of page.sections) {
            for (const column of section.columns) {
                for (const line of column.lines) {
                    let lineWidth = 0;
                    for (const divide of line.divides) {
                        for (const glyph of divide.glyphGroup) {
                            lineWidth += glyph.width;
                        }
                    }
                    maxWidth = Math.max(maxWidth, lineWidth);
                }
            }
        }

        return maxWidth;
    }

    getPageSize() {
        return this.getViewModel().getDataModel().documentStyle.pageSize;
    }

    findPositionByGlyph(glyph: IDocumentSkeletonGlyph): Nullable<INodeSearch> {
        const divide = glyph.parent;

        const line = divide?.parent;

        const column = line?.parent;

        const section = column?.parent;

        const page = section?.parent;

        const skeletonData = this.getSkeletonData();

        if (!divide || !column || !section || !page || !skeletonData) {
            return;
        }

        const glyphIndex = divide.glyphGroup.indexOf(glyph);

        const divideIndex = line.divides.indexOf(divide);

        const lineIndex = column.lines.indexOf(line);

        const columnIndex = section.columns.indexOf(column);

        const sectionIndex = page.sections.indexOf(section);

        const pageIndex = skeletonData.pages.indexOf(page);

        return {
            glyph: glyphIndex,
            divide: divideIndex,
            line: lineIndex,
            column: columnIndex,
            section: sectionIndex,
            page: pageIndex,
        };
    }

    findNodePositionByCharIndex(charIndex: number, isBack: boolean = true): Nullable<INodePosition> {
        const nodes = this._findNodeIterator(charIndex);

        if (nodes == null) {
            return;
        }

        const skeletonData = this.getSkeletonData();

        if (!skeletonData) {
            return;
        }

        const pages = skeletonData.pages;

        const { glyph, divide, line, column, section, page } = nodes;

        return {
            glyph: divide.glyphGroup.indexOf(glyph),
            divide: line.divides.indexOf(divide),
            line: column.lines.indexOf(line),
            column: section.columns.indexOf(column),
            section: page.sections.indexOf(section),
            page: pages.indexOf(page),
            isBack,
        };
    }

    findNodeByCharIndex(charIndex: number): Nullable<IDocumentSkeletonGlyph> {
        const nodes = this._findNodeIterator(charIndex);

        return nodes?.glyph;
    }

    findGlyphByPosition(position: Nullable<INodePosition>) {
        if (position == null) {
            return;
        }

        const skeletonData = this.getSkeletonData();

        if (skeletonData == null) {
            return;
        }

        const { divide, line, column, section, page, isBack } = position;

        let { glyph } = position;

        if (isBack === true) {
            glyph -= 1;
        }

        glyph = glyph < 0 ? 0 : glyph;

        const glyphGroup =
            skeletonData.pages[page].sections[section].columns[column].lines[line].divides[divide].glyphGroup;

        if (glyphGroup[glyph].glyphType === GlyphType.LIST) {
            return glyphGroup[glyph + 1];
        }

        return glyphGroup[glyph];
    }

    findNodeByCoord(
        coord: Vector2,
        pageLayoutType: PageLayoutType,
        pageMarginLeft: number,
        pageMarginTop: number
    ): Nullable<INodeInfo> {
        const { x, y } = coord;

        this._findLiquid.reset();

        const skeletonData = this.getSkeletonData();

        if (skeletonData == null) {
            return;
        }

        const pages = skeletonData.pages;

        let nearestNodeList: INodeInfo[] = [];

        let nearestNodeDistanceList: number[] = [];

        let nearestNodeDistanceY = Number.POSITIVE_INFINITY;

        for (let i = 0, len = pages.length; i < len; i++) {
            const page = pages[i];

            // const { startX, startY, endX, endY } = this._getPageBoundingBox(page, pageLayoutType);

            // if (!(x >= startX && x <= endX && y >= startY && y <= endY)) {
            //     this._translatePage(page, pageLayoutType, pageMarginLeft, pageMarginTop);
            //     continue;
            // }

            this._findLiquid.translatePagePadding(page);

            const sections = page.sections;

            for (const section of sections) {
                const { columns, height } = section;

                this._findLiquid.translateSection(section);

                // const { y: startY } = this._findLiquid;

                // if (!(y >= startY && y <= startY + height)) {
                //     continue;
                // }

                for (const column of columns) {
                    const { lines, width: columnWidth } = column;

                    this._findLiquid.translateColumn(column);

                    // const { x: startX } = this._findLiquid;

                    // if (!(x >= startX && x <= startX + columnWidth)) {
                    //     continue;
                    // }

                    const linesCount = lines.length;

                    for (let i = 0; i < linesCount; i++) {
                        const line = lines[i];
                        const { divides, type, lineHeight = 0 } = line;

                        if (type === LineType.BLOCK) {
                            continue;
                        } else {
                            this._findLiquid.translateSave();
                            this._findLiquid.translateLine(line);

                            const { y: startY } = this._findLiquid;

                            const startY_fin = startY;

                            const endY_fin = startY + lineHeight;

                            const distanceY = Math.abs(y - endY_fin);

                            // if (!(y >= startY_fin && y <= endY_fin)) {
                            //     this._findLiquid.translateRestore();
                            //     continue;
                            // }

                            const divideLength = divides.length;
                            for (let i = 0; i < divideLength; i++) {
                                const divide = divides[i];
                                const { glyphGroup, width: divideWidth } = divide;

                                this._findLiquid.translateSave();
                                this._findLiquid.translateDivide(divide);

                                const { x: startX } = this._findLiquid;

                                // if (!(x >= startX && x <= startX + divideWidth)) {
                                //     this._findLiquid.translateRestore();
                                //     continue;
                                // }

                                for (const glyph of glyphGroup) {
                                    if (!glyph.content || glyph.content.length === 0) {
                                        continue;
                                    }

                                    const { width: glyphWidth, left: glyphLeft } = glyph;

                                    const startX_fin = startX + glyphLeft;

                                    const endX_fin = startX + glyphLeft + glyphWidth;

                                    const distanceX = Math.abs(x - endX_fin);

                                    if (y >= startY_fin && y <= endY_fin) {
                                        if (x >= startX_fin && x <= endX_fin) {
                                            return {
                                                node: glyph,
                                                ratioX: x / (startX_fin + endX_fin),
                                                ratioY: y / (startY_fin + endY_fin),
                                            };
                                        }

                                        if (nearestNodeDistanceY !== Number.NEGATIVE_INFINITY) {
                                            nearestNodeList = [];
                                            nearestNodeDistanceList = [];
                                        }
                                        nearestNodeList.push({
                                            node: glyph,
                                            ratioX: x / (startX_fin + endX_fin),
                                            ratioY: y / (startY_fin + endY_fin),
                                        });

                                        nearestNodeDistanceList.push(distanceX);

                                        nearestNodeDistanceY = Number.NEGATIVE_INFINITY;
                                        continue;
                                    }

                                    if (distanceY < nearestNodeDistanceY) {
                                        nearestNodeDistanceY = distanceY;
                                        nearestNodeList = [];
                                        nearestNodeDistanceList = [];
                                    }

                                    if (distanceY === nearestNodeDistanceY) {
                                        nearestNodeList.push({
                                            node: glyph,
                                            ratioX: x / (startX_fin + endX_fin),
                                            ratioY: y / (startY_fin + endY_fin),
                                        });

                                        nearestNodeDistanceList.push(distanceX);
                                    }
                                }
                                this._findLiquid.translateRestore();
                            }
                            this._findLiquid.translateRestore();
                        }
                    }
                }
            }
            this._findLiquid.restorePagePadding(page);
            this._translatePage(page, pageLayoutType, pageMarginLeft, pageMarginTop);
        }

        return this._getNearestNode(nearestNodeList, nearestNodeDistanceList);
    }

    private _getNearestNode(nearestNodeList: INodeInfo[], nearestNodeDistanceList: number[]) {
        const miniValue = Math.min(...nearestNodeDistanceList);
        const miniValueIndex = nearestNodeDistanceList.indexOf(miniValue);
        return nearestNodeList[miniValueIndex];
    }

    private _getPageBoundingBox(page: IDocumentSkeletonPage, pageLayoutType: PageLayoutType) {
        const { pageWidth, pageHeight } = page;
        const { x: startX, y: startY } = this._findLiquid;

        let endX = -1;
        let endY = -1;
        if (pageLayoutType === PageLayoutType.VERTICAL) {
            endX = pageWidth;
            endY = startY + pageHeight;
        } else if (pageLayoutType === PageLayoutType.HORIZONTAL) {
            endX = startX + pageWidth;
            endY = pageHeight;
        }

        return {
            startX,
            startY,
            endX,
            endY,
        };
    }

    private _translatePage(
        page: IDocumentSkeletonPage,
        pageLayoutType: PageLayoutType,
        pageMarginLeft: number,
        pageMarginTop: number
    ) {
        this._findLiquid.translatePage(page, pageLayoutType, pageMarginLeft, pageMarginTop);
    }

    /**
     * \v COLUMN_BREAK
     * \f PAGE_BREAK
     * \0 DOCS_END
     * \t TAB
     *
     * Needs to be changed：
     * \r PARAGRAPH
     * \n SECTION_BREAK
     *
     * \b customBlock: Scenarios where customBlock, images, mentions, etc. do not participate in the document flow.
     *
     * Table
     * \x1A table start
     * \x1B table row start
     * \x1C table cell start
     * \x1D table cell end
     * \x1E table row end
     * \x1F table end
     *
     * Special ranges within the document flow:：hyperlinks，field，structured document tags， bookmark，comment
     * \x1F customRange start
     * \x1E customRange end
     *
     * Split the document according to SectionBreak and perform layout calculations.
     * @returns view model: skeleton
     */
    private _createSkeleton(_bounds?: IViewportBound) {
        // 每一个布局
        const DEFAULT_PAGE_SIZE = { width: Number.POSITIVE_INFINITY, height: Number.POSITIVE_INFINITY };
        const viewModel = this.getViewModel();
        const { headerTreeMap, footerTreeMap } = viewModel;
        const { documentStyle, drawings, lists: customLists = {} } = viewModel.getDataModel();
        const lists = {
            ...PRESET_LIST_TYPE,
            ...customLists,
        };
        const {
            pageNumberStart: global_pageNumberStart = 1, // pageNumberStart
            pageSize: global_pageSize = DEFAULT_PAGE_SIZE,
            pageOrient: global_pageOrient = PageOrientType.PORTRAIT,
            defaultHeaderId: global_defaultHeaderId,
            defaultFooterId: global_defaultFooterId,
            evenPageHeaderId: global_evenPageHeaderId,
            evenPageFooterId: global_evenPageFooterId,
            firstPageHeaderId: global_firstPageHeaderId,
            firstPageFooterId: global_firstPageFooterId,
            useFirstPageHeaderFooter: global_useFirstPageHeaderFooter,
            useEvenPageHeaderFooter: global_useEvenPageHeaderFooter,

            marginTop: global_marginTop = 0,
            marginBottom: global_marginBottom = 0,
            marginRight: global_marginRight = 0,
            marginLeft: global_marginLeft = 0,
            marginHeader: global_marginHeader = 0,
            marginFooter: global_marginFooter = 0,

            charSpace = 0, // charSpace
            linePitch = 15.6, // linePitch pt
            gridType = GridType.LINES, // gridType
            paragraphLineGapDefault = 0,
            defaultTabStop = 10.5,
            textStyle = {},
            renderConfig: global_renderConfig = {
                horizontalAlign: HorizontalAlign.LEFT,
                verticalAlign: VerticalAlign.TOP,
                centerAngle: 0,
                vertexAngle: 0,
                wrapStrategy: WrapStrategy.UNSPECIFIED,
            },
        } = documentStyle;

        const docsConfig: IDocsConfig = {
            headerTreeMap,
            footerTreeMap,
            lists,
            drawings,

            charSpace,
            linePitch,
            gridType,
            localeService: this._localService,
            paragraphLineGapDefault,
            defaultTabStop,
            documentTextStyle: textStyle,
        };

        const skeleton = this._getNullSke();

        const { skeHeaders, skeFooters, skeListLevel, drawingAnchor } = skeleton;

        const skeletonResourceReference: ISkeletonResourceReference = {
            skeHeaders,
            skeFooters,
            skeListLevel,
            drawingAnchor,
        };

        const allSkeletonPages: IDocumentSkeletonPage[] = [];

        skeleton.pages = allSkeletonPages;

        const bodyModel = this.getViewModel();

        bodyModel.resetCache();

        for (let i = 0, len = bodyModel.children.length; i < len; i++) {
            const sectionNode = bodyModel.children[i];
            const sectionBreak = bodyModel.getSectionBreak(sectionNode.endIndex) || DEFAULT_SECTION_BREAK;
            const {
                pageNumberStart = global_pageNumberStart,
                pageSize = global_pageSize,
                pageOrient = global_pageOrient,
                marginTop = global_marginTop,
                marginBottom = global_marginBottom,
                marginRight = global_marginRight,
                marginLeft = global_marginLeft,
                marginHeader = global_marginHeader,
                marginFooter = global_marginFooter,

                defaultHeaderId = global_defaultHeaderId,
                defaultFooterId = global_defaultFooterId,
                evenPageHeaderId = global_evenPageHeaderId,
                evenPageFooterId = global_evenPageFooterId,
                firstPageHeaderId = global_firstPageHeaderId,
                firstPageFooterId = global_firstPageFooterId,
                useFirstPageHeaderFooter = global_useFirstPageHeaderFooter,
                useEvenPageHeaderFooter = global_useEvenPageHeaderFooter,

                columnProperties = [],
                columnSeparatorType = ColumnSeparatorType.NONE,
                contentDirection,
                sectionType,
                textDirection,
                renderConfig = global_renderConfig,
            } = sectionBreak;

            const sectionNodeNext = bodyModel.children[i + 1];
            const sectionTypeNext = bodyModel.getSectionBreak(sectionNodeNext?.endIndex)?.sectionType;

            const headerIds = { defaultHeaderId, evenPageHeaderId, firstPageHeaderId };
            const footerIds = { defaultFooterId, evenPageFooterId, firstPageFooterId };

            if (pageSize.width === null) {
                pageSize.width = Number.POSITIVE_INFINITY;
            }

            if (pageSize.height === null) {
                pageSize.height = Number.POSITIVE_INFINITY;
            }

            const sectionBreakConfig: ISectionBreakConfig = {
                pageNumberStart,
                pageSize,
                pageOrient,
                marginTop,
                marginBottom,
                marginRight,
                marginLeft,
                marginHeader,
                marginFooter,

                headerIds,
                footerIds,

                useFirstPageHeaderFooter,
                useEvenPageHeaderFooter,

                columnProperties,
                columnSeparatorType,
                contentDirection,
                sectionType,
                sectionTypeNext,
                textDirection,
                renderConfig,

                ...docsConfig,
            };

            let curSkeletonPage: IDocumentSkeletonPage = getLastPage(allSkeletonPages);
            let isContinuous = false;

            if (sectionType === SectionType.CONTINUOUS) {
                updateBlockIndex(allSkeletonPages);
                this._addNewSectionByContinuous(curSkeletonPage, columnProperties, columnSeparatorType);
                isContinuous = true;
            } else {
                curSkeletonPage = createSkeletonPage(
                    sectionBreakConfig,
                    skeletonResourceReference,
                    curSkeletonPage?.pageNumber
                );
            }

            // 计算页内布局，block 结构
            const blockInfo = dealWithSections(
                bodyModel,
                sectionNode,
                curSkeletonPage,
                sectionBreakConfig,
                skeletonResourceReference,
                this._renderedBlockIdMap
            );

            // todo: 当本节有多个列，且下一节为连续节类型的时候，需要按照列数分割，重新计算 lines
            if (sectionTypeNext === SectionType.CONTINUOUS && columnProperties.length > 0) {
                // TODO
            }

            const { pages } = blockInfo;

            // renderedBlockIdMap.forEach((value, blockId) => {
            //     this._renderedBlockIdMap.set(blockId, value);
            // });

            if (isContinuous) {
                pages.splice(0, 1);
            }

            allSkeletonPages.push(...pages);
        }

        // 计算页和节的位置信息
        updateBlockIndex(allSkeletonPages);

        this._setPageParent(allSkeletonPages, skeleton);

        return skeleton;
    }

    private _setPageParent(pages: IDocumentSkeletonPage[], parent: IDocumentSkeletonCached) {
        for (const page of pages) {
            page.parent = parent;
        }
    }

    // 一页存在多个 section 的情况，仅在 SectionType.CONTINUOUS 的情况下出现
    private _addNewSectionByContinuous(
        curSkeletonPage: IDocumentSkeletonPage,
        columnProperties: ISectionColumnProperties[],
        columnSeparatorType: ColumnSeparatorType
    ) {
        const sections = curSkeletonPage.sections;
        const lastSection = sections[sections.length - 1];
        const {
            pageWidth,
            pageHeight,
            marginTop: curPageMT,
            marginBottom: curPageMB,
            marginLeft: curPageML,
            marginRight: curPageMR,
        } = curSkeletonPage;
        const pageContentWidth = pageWidth - curPageML - curPageMR;
        const pageContentHeight = pageHeight - curPageMT - curPageMB;
        const lastSectionBottom = (lastSection?.top || 0) + (lastSection?.height || 0);
        const newSection = createSkeletonSection(
            columnProperties,
            columnSeparatorType,
            lastSectionBottom,
            0,
            pageContentWidth,
            pageContentHeight - lastSectionBottom
        );
        newSection.parent = curSkeletonPage;
        sections.push(newSection);
    }

    private _getNullSke(): IDocumentSkeletonCached {
        return {
            pages: [],
            left: 0,
            top: 0,
            st: 0,
            skeHeaders: new Map(),
            skeFooters: new Map(),
            skeListLevel: new Map(),
            drawingAnchor: new Map(),
        };
    }

    private _findNodeIterator(charIndex: number) {
        const skeletonData = this.getSkeletonData();

        if (!skeletonData) {
            return;
        }

        const pages = skeletonData.pages;

        for (const page of pages) {
            const { sections, st, ed } = page;

            if (charIndex < st || charIndex > ed) {
                continue;
            }

            for (const section of sections) {
                const { columns, st, ed } = section;

                if (charIndex < st || charIndex > ed) {
                    continue;
                }

                for (const column of columns) {
                    const { lines, st, ed } = column;

                    if (charIndex < st || charIndex > ed) {
                        continue;
                    }

                    for (const line of lines) {
                        const { divides, st, ed } = line;
                        const divideLength = divides.length;

                        if (charIndex < st || charIndex > ed) {
                            continue;
                        }

                        for (let i = 0; i < divideLength; i++) {
                            const divide = divides[i];
                            const { glyphGroup, st, ed } = divide;

                            if (charIndex < st || charIndex > ed) {
                                continue;
                            }

                            // Some glyph.content's length maybe great than 1, so the charIndex is not equal to glyphIndex.
                            let delta = charIndex - st;

                            for (const glyph of glyphGroup) {
                                delta -= glyph.count;

                                if (delta < 0) {
                                    return {
                                        page,
                                        section,
                                        column,
                                        line,
                                        divide,
                                        glyph,
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
