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

import { UpdateDocsAttributeType } from '../../../shared/command-enum';
import { Tools } from '../../../shared/tools';
import type { IDocumentBody, IParagraph, ITextRun } from '../../../types/interfaces/i-document-data';
import type { IRetainAction } from '../action-types';
import { coverTextRuns } from '../apply-utils/update-apply';

export function getBodySlice(body: IDocumentBody, startOffset: number, endOffset: number): IDocumentBody {
    const { dataStream, textRuns = [], paragraphs = [] } = body;

    const docBody: IDocumentBody = {
        dataStream: dataStream.slice(startOffset, endOffset),
    };

    const newTextRuns: ITextRun[] = [];

    for (const textRun of textRuns) {
        const clonedTextRun = Tools.deepClone(textRun);
        const { st, ed } = clonedTextRun;

        if (Tools.hasIntersectionBetweenTwoRanges(st, ed, startOffset, endOffset)) {
            if (startOffset >= st && startOffset <= ed) {
                newTextRuns.push({
                    ...clonedTextRun,
                    st: startOffset,
                    ed: Math.min(endOffset, ed),
                });
            } else if (endOffset >= st && endOffset <= ed) {
                newTextRuns.push({
                    ...clonedTextRun,
                    st: Math.max(startOffset, st),
                    ed: endOffset,
                });
            } else {
                newTextRuns.push(clonedTextRun);
            }
        }
    }

    if (newTextRuns.length) {
        docBody.textRuns = newTextRuns.map((tr) => {
            const { st, ed } = tr;
            return {
                ...tr,
                st: st - startOffset,
                ed: ed - startOffset,
            };
        });
    }

    const newParagraphs: IParagraph[] = [];

    for (const paragraph of paragraphs) {
        const { startIndex } = paragraph;
        if (startIndex >= startOffset && startIndex <= endOffset) {
            newParagraphs.push(Tools.deepClone(paragraph));
        }
    }

    if (newParagraphs.length) {
        docBody.paragraphs = newParagraphs.map((p) => ({
            ...p,
            startIndex: p.startIndex - startOffset,
        }));
    }

    return docBody;
}

export function composeBody(
    thisBody: IDocumentBody,
    otherBody: IDocumentBody,
    coverType: UpdateDocsAttributeType = UpdateDocsAttributeType.COVER
): IDocumentBody {
    if (otherBody.dataStream !== '') {
        throw new Error('Cannot compose other body with non-empty dataStream');
    }

    const retBody: IDocumentBody = {
        dataStream: thisBody.dataStream,
    };

    const { textRuns: thisTextRuns = [], paragraphs: thisParagraphs = [] } = thisBody;
    const { textRuns: otherTextRuns = [], paragraphs: otherParagraphs = [] } = otherBody;

    const textRuns = coverTextRuns(otherTextRuns, thisTextRuns, coverType);
    if (textRuns.length) {
        retBody.textRuns = textRuns;
    }

    const paragraphs: IParagraph[] = [];

    let thisIndex = 0;
    let otherIndex = 0;

    while (thisIndex < thisParagraphs.length && otherIndex < otherParagraphs.length) {
        const thisParagraph = thisParagraphs[thisIndex];
        const otherParagraph = otherParagraphs[otherIndex];

        const { startIndex: thisStart } = thisParagraph;
        const { startIndex: otherStart } = otherParagraph;

        if (thisStart === otherStart) {
            paragraphs.push(Tools.deepMerge(thisParagraph, otherParagraph));
            thisIndex++;
            otherIndex++;
        } else if (thisStart < otherStart) {
            paragraphs.push(Tools.deepClone(thisParagraph));
            thisIndex++;
        } else {
            paragraphs.push(Tools.deepClone(otherParagraph));
            otherIndex++;
        }
    }

    if (thisIndex < thisParagraphs.length) {
        paragraphs.push(...thisParagraphs.slice(thisIndex));
    }

    if (otherIndex < otherParagraphs.length) {
        paragraphs.push(...otherParagraphs.slice(otherIndex));
    }

    if (paragraphs.length) {
        retBody.paragraphs = paragraphs;
    }

    return retBody;
}

export function isUselessRetainAction(action: IRetainAction): boolean {
    const { body } = action;

    if (body == null) {
        return true;
    }

    const { textRuns = [], paragraphs = [] } = body;

    if (textRuns.length === 0 && paragraphs.length === 0) {
        return true;
    }

    return false;
}
