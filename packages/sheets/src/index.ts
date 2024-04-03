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

export { type IUniverSheetsConfig, UniverSheetsPlugin } from './sheets-plugin';

// #region services
export { COMMAND_LISTENER_SKELETON_CHANGE, COMMAND_LISTENER_VALUE_CHANGE } from './basics/const/command-listener-const';
export {
    type IAddWorksheetMergeMutationParams,
    type IDeleteRangeMutationParams,
    type IInsertColMutationParams,
    type IInsertRangeMutationParams,
    type IInsertRowMutationParams,
    type IInsertSheetMutationParams,
    type IRemoveColMutationParams,
    type IRemoveRowsMutationParams,
    type IRemoveSheetMutationParams,
    type IRemoveWorksheetMergeMutationParams,
} from './basics/interfaces/mutation-interface';
export {
    convertPrimaryWithCoordToPrimary,
    convertSelectionDataToRange,
    getNormalSelectionStyle,
    type ISelectionStyle,
    type ISelectionWidgetConfig,
    type ISelectionWithCoordAndStyle,
    type ISelectionWithStyle,
    SELECTION_CONTROL_BORDER_BUFFER_COLOR,
    SELECTION_CONTROL_BORDER_BUFFER_WIDTH,
    transformCellDataToSelectionData,
} from './basics/selection';
export { alignToMergedCellsBorders, getCellAtRowCol, setEndForRange } from './commands/commands/utils/selection-utils';
export { MAX_CELL_PER_SHEET_KEY } from './controllers/config/config';
export { BorderStyleManagerService, type IBorderInfo } from './services/border-style-manager.service';
export { getCurrentSheetDisabled$, SheetEditablePermission, SheetPermissionService } from './services/permission';
export {
    NORMAL_SELECTION_PLUGIN_NAME,
    SelectionManagerService,
    SelectionMoveType,
} from './services/selection-manager.service';

// #region commands

export { rangeMerge, createTopMatrixFromRanges, createTopMatrixFromMatrix, findAllRectangle, RangeMergeUtil } from './basics/rangeMerge';
export { ClearSelectionAllCommand } from './commands/commands/clear-selection-all.command';
export { ClearSelectionContentCommand } from './commands/commands/clear-selection-content.command';
export { ClearSelectionFormatCommand } from './commands/commands/clear-selection-format.command';
export { CopySheetCommand } from './commands/commands/copy-worksheet.command';
export { DeleteRangeMoveLeftCommand } from './commands/commands/delete-range-move-left.command';
export { type IDeleteRangeMoveLeftCommandParams } from './commands/commands/delete-range-move-left.command';
export { DeleteRangeMoveUpCommand } from './commands/commands/delete-range-move-up.command';
export { type IDeleteRangeMoveUpCommandParams } from './commands/commands/delete-range-move-up.command';
export { InsertRangeMoveDownCommand } from './commands/commands/insert-range-move-down.command';
export { type InsertRangeMoveDownCommandParams } from './commands/commands/insert-range-move-down.command';
export { InsertRangeMoveRightCommand } from './commands/commands/insert-range-move-right.command';
export { type InsertRangeMoveRightCommandParams } from './commands/commands/insert-range-move-right.command';
export type { IInsertColCommandParams, IInsertRowCommandParams } from './commands/commands/insert-row-col.command';
export {
    InsertColAfterCommand,
    InsertColBeforeCommand,
    InsertColCommand,
    InsertRowAfterCommand,
    InsertRowBeforeCommand,
    InsertRowCommand,
} from './commands/commands/insert-row-col.command';
export type { IInsertSheetCommandParams } from './commands/commands/insert-sheet.command';
export { InsertSheetCommand } from './commands/commands/insert-sheet.command';
export { type IMoveRangeCommandParams, MoveRangeCommand } from './commands/commands/move-range.command';
export {
    type IMoveColsCommandParams,
    type IMoveRowsCommandParams,
    MoveColsCommand,
    MoveRowsCommand,
} from './commands/commands/move-rows-cols.command';
export type { IRemoveRowColCommandParams } from './commands/commands/remove-row-col.command';
export { RemoveColCommand, RemoveRowCommand } from './commands/commands/remove-row-col.command';
export type { IRemoveSheetCommandParams } from './commands/commands/remove-sheet.command';
export { RemoveSheetCommand } from './commands/commands/remove-sheet.command';
export { RemoveWorksheetMergeCommand } from './commands/commands/remove-worksheet-merge.command';
export type {
    ISetBorderBasicCommandParams,
    ISetBorderColorCommandParams,
    ISetBorderCommandParams,
    ISetBorderPositionCommandParams,
    ISetBorderStyleCommandParams,
} from './commands/commands/set-border-command';
export {
    SetBorderBasicCommand,
    SetBorderColorCommand,
    SetBorderCommand,
    SetBorderPositionCommand,
    SetBorderStyleCommand,
} from './commands/commands/set-border-command';
export {
    type ISetSpecificColsVisibleCommandParams,
    SetColHiddenCommand,
    SetSelectedColsVisibleCommand,
    SetSpecificColsVisibleCommand,
} from './commands/commands/set-col-visible.command';
export { SetFrozenCommand } from './commands/commands/set-frozen.command';
export { type ISetRangeValuesCommandParams, SetRangeValuesCommand } from './commands/commands/set-range-values.command';
export {
    type ISetSpecificRowsVisibleCommandParams,
    SetRowHiddenCommand,
    SetSelectedRowsVisibleCommand,
    SetSpecificRowsVisibleCommand,
} from './commands/commands/set-row-visible.command';
export {
    type ISetColorCommandParams,
    type ISetFontFamilyCommandParams,
    type ISetFontSizeCommandParams,
    type ISetHorizontalTextAlignCommandParams,
    type ISetStyleCommandParams,
    type ISetTextRotationCommandParams,
    type ISetTextWrapCommandParams,
    type ISetVerticalTextAlignCommandParams,
    type IStyleTypeValue,
    ResetBackgroundColorCommand,
    ResetTextColorCommand,
    SetBackgroundColorCommand,
    SetBoldCommand,
    SetFontFamilyCommand,
    SetFontSizeCommand,
    SetHorizontalTextAlignCommand,
    SetItalicCommand,
    SetStrikeThroughCommand,
    SetStyleCommand,
    SetTextColorCommand,
    SetTextRotationCommand,
    SetTextWrapCommand,
    SetUnderlineCommand,
    SetVerticalTextAlignCommand,
} from './commands/commands/set-style.command';
export { SetTabColorCommand } from './commands/commands/set-tab-color.command';
export {
    type ISetWorksheetActivateCommandParams,
    SetWorksheetActivateCommand,
} from './commands/commands/set-worksheet-activate.command';
export {
    DeltaColumnWidthCommand,
    type IDeltaColumnWidthCommandParams,
    SetColWidthCommand,
} from './commands/commands/set-worksheet-col-width.command';
export { SetWorksheetHideCommand } from './commands/commands/set-worksheet-hide.command';
export {
    type ISetWorksheetNameCommandParams,
    SetWorksheetNameCommand,
} from './commands/commands/set-worksheet-name.command';
export { SetWorksheetOrderCommand } from './commands/commands/set-worksheet-order.command';
export {
    DeltaRowHeightCommand,
    type IDeltaRowHeightCommand,
    type ISetWorksheetRowIsAutoHeightCommandParams,
    SetRowHeightCommand,
    SetWorksheetRowIsAutoHeightCommand,
} from './commands/commands/set-worksheet-row-height.command';
export { SetWorksheetShowCommand } from './commands/commands/set-worksheet-show.command';
export { followSelectionOperation, getPrimaryForRange } from './commands/commands/utils/selection-utils';
export {
    AddMergeUndoMutationFactory,
    AddWorksheetMergeMutation,
} from './commands/mutations/add-worksheet-merge.mutation';
export { EmptyMutation } from './commands/mutations/empty.mutation';
export {
    InsertColMutation,
    InsertColMutationUndoFactory,
    InsertRowMutation,
    InsertRowMutationUndoFactory,
} from './commands/mutations/insert-row-col.mutation';
export { InsertSheetMutation, InsertSheetUndoMutationFactory } from './commands/mutations/insert-sheet.mutation';
export { MoveRangeMutation } from './commands/mutations/move-range.mutation';
export { type IMoveRangeMutationParams } from './commands/mutations/move-range.mutation';
export { type IMoveColumnsMutationParams } from './commands/mutations/move-rows-cols.mutation';
export { type IMoveRowsMutationParams, MoveRowsMutation } from './commands/mutations/move-rows-cols.mutation';
export { MoveColsMutation } from './commands/mutations/move-rows-cols.mutation';
export type {
    IRemoveNumfmtMutationParams,
    ISetCellsNumfmt,
    ISetNumfmtMutationParams,
} from './commands/mutations/numfmt-mutation';
export {
    factoryRemoveNumfmtUndoMutation,
    factorySetNumfmtUndoMutation,
    RemoveNumfmtMutation,
    SetNumfmtMutation,
    transformCellsToRange,
} from './commands/mutations/numfmt-mutation';
export { RemoveColMutation, RemoveRowMutation } from './commands/mutations/remove-row-col.mutation';
export { RemoveSheetMutation, RemoveSheetUndoMutationFactory } from './commands/mutations/remove-sheet.mutation';
export { RemoveWorksheetMergeMutation } from './commands/mutations/remove-worksheet-merge.mutation';
export { RemoveMergeUndoMutationFactory } from './commands/mutations/remove-worksheet-merge.mutation';
export {
    type ISetColHiddenMutationParams,
    type ISetColVisibleMutationParams,
    SetColHiddenMutation,
    SetColVisibleMutation,
} from './commands/mutations/set-col-visible.mutation';
export {
    type ISetFrozenMutationParams,
    SetFrozenMutation,
    SetFrozenMutationFactory,
} from './commands/mutations/set-frozen.mutation';
export type { ISetRangeValuesMutationParams } from './commands/mutations/set-range-values.mutation';
export { SetRangeValuesMutation } from './commands/mutations/set-range-values.mutation';
export { SetRangeValuesUndoMutationFactory } from './commands/mutations/set-range-values.mutation';
export { type ISetRangeValuesRangeMutationParams } from './commands/mutations/set-range-values.mutation';
export {
    type ISetRowHiddenMutationParams,
    type ISetRowVisibleMutationParams,
    SetRowHiddenMutation, SetRowVisibleMutation } from './commands/mutations/set-row-visible.mutation';
export { SetTabColorMutation } from './commands/mutations/set-tab-color.mutation';
export { type ISetTabColorMutationParams } from './commands/mutations/set-tab-color.mutation';
export {
    type ISetWorksheetColWidthMutationParams,
    SetWorksheetColWidthMutation,
    SetWorksheetColWidthMutationFactory,
} from './commands/mutations/set-worksheet-col-width.mutation';
export {
    type ISetWorksheetHideMutationParams,
    SetWorksheetHideMutation,
} from './commands/mutations/set-worksheet-hide.mutation';
export { SetWorksheetNameMutation } from './commands/mutations/set-worksheet-name.mutation';
export { type ISetWorksheetNameMutationParams } from './commands/mutations/set-worksheet-name.mutation';
export { SetWorksheetOrderMutation } from './commands/mutations/set-worksheet-order.mutation';
export { type ISetWorksheetOrderMutationParams } from './commands/mutations/set-worksheet-order.mutation';
export {
    type ISetWorksheetRowAutoHeightMutationParams,
    type ISetWorksheetRowHeightMutationParams,
    type ISetWorksheetRowIsAutoHeightMutationParams,
    SetWorksheetRowAutoHeightMutation,
    SetWorksheetRowAutoHeightMutationFactory,
    SetWorksheetRowHeightMutation,
    SetWorksheetRowIsAutoHeightMutation,
} from './commands/mutations/set-worksheet-row-height.mutation';
export { type ISetSelectionsOperationParams, SetSelectionsOperation } from './commands/operations/selection.operation';
export { SetWorksheetActiveOperation } from './commands/operations/set-worksheet-active.operation';
export { type ISetWorksheetActiveOperationParams } from './commands/operations/set-worksheet-active.operation';
export { handleDeleteRangeMutation } from './commands/utils/handle-range-mutation';
export { getInsertRangeMutations, getRemoveRangeMutations } from './commands/utils/handle-range-mutation';
export { handleInsertRangeMutation } from './commands/utils/handle-range-mutation';
export { type ISheetCommandSharedParams } from './commands/utils/interface';
export { getAddMergeMutationRangeByType } from './controllers/merge-cell.controller';
export { enUS, zhCN } from './locale';
export { NumfmtService } from './services/numfmt/numfmt.service';
export type { FormatType, INumfmtItem, INumfmtItemWithCache } from './services/numfmt/type';
export { INumfmtService } from './services/numfmt/type';
export { RefRangeService } from './services/ref-range/ref-range.service';
export type { EffectRefRangeParams, IOperator } from './services/ref-range/type';
export { EffectRefRangId, OperatorType } from './services/ref-range/type';
export {
    handleBaseInsertRange,
    handleBaseMoveRowsCols,
    handleBaseRemoveRange,
    handleDeleteRangeMoveLeft,
    handleDeleteRangeMoveUp,
    handleInsertCol,
    handleInsertRangeMoveDown,
    handleInsertRangeMoveRight,
    handleInsertRow,
    handleIRemoveCol,
    handleIRemoveRow,
    handleMoveCols,
    handleMoveRange,
    handleMoveRows,
    rotateRange,
    runRefRangeMutations,
    handleDefaultRangeChangeWithEffectRefCommands,
} from './services/ref-range/util';
export { INTERCEPTOR_POINT } from './services/sheet-interceptor/interceptor-const';
export { SheetInterceptorService } from './services/sheet-interceptor/sheet-interceptor.service';
export type { ISheetLocation } from './services/sheet-interceptor/utils/interceptor';
export { MergeCellController } from './controllers/merge-cell.controller';
export { AddMergeRedoSelectionsOperationFactory, AddMergeUndoSelectionsOperationFactory } from './commands/utils/handle-merge-operation';
