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

import { Plugin } from '@univerjs/core';
import type { Ctor, Dependency } from '@wendellhu/redi';
import { Inject, Injector } from '@wendellhu/redi';

import type { IFunctionNames } from './basics/function';
import { CalculateController } from './controller/calculate.controller';
import { FormulaController } from './controller/formula.controller';
import { RegisterFunctionController } from './controller/register-function.controller';
import { SetDefinedNameController } from './controller/set-defined-name.controller';
import { SetFeatureCalculationController } from './controller/set-feature-calculation.controller';
import { SetOtherFormulaController } from './controller/set-other-formula.controller';
import { SetSuperTableController } from './controller/set-super-table.controller';
import { Lexer } from './engine/analysis/lexer';
import { LexerTreeBuilder } from './engine/analysis/lexer-tree-builder';
import { AstTreeBuilder } from './engine/analysis/parser';
import { AstRootNodeFactory } from './engine/ast-node/ast-root-node';
import { FunctionNodeFactory } from './engine/ast-node/function-node';
import { LambdaNodeFactory } from './engine/ast-node/lambda-node';
import { LambdaParameterNodeFactory } from './engine/ast-node/lambda-parameter-node';
import { OperatorNodeFactory } from './engine/ast-node/operator-node';
import { PrefixNodeFactory } from './engine/ast-node/prefix-node';
import { ReferenceNodeFactory } from './engine/ast-node/reference-node';
import { SuffixNodeFactory } from './engine/ast-node/suffix-node';
import { UnionNodeFactory } from './engine/ast-node/union-node';
import { ValueNodeFactory } from './engine/ast-node/value-node';
import { FormulaDependencyGenerator } from './engine/dependency/formula-dependency';
import { Interpreter } from './engine/interpreter/interpreter';
import type { BaseFunction } from './functions/base-function';
import { FormulaDataModel } from './models/formula-data.model';
import { CalculateFormulaService } from './services/calculate-formula.service';
import { FormulaCurrentConfigService, IFormulaCurrentConfigService } from './services/current-data.service';
import { DefinedNamesService, IDefinedNamesService } from './services/defined-names.service';
import {
    FeatureCalculationManagerService,
    IFeatureCalculationManagerService,
} from './services/feature-calculation-manager.service';
import { FunctionService, IFunctionService } from './services/function.service';
import { IOtherFormulaManagerService, OtherFormulaManagerService } from './services/other-formula-manager.service';
import { FormulaRuntimeService, IFormulaRuntimeService } from './services/runtime.service';
import { ISuperTableService, SuperTableService } from './services/super-table.service';
import { ActiveDirtyManagerService, IActiveDirtyManagerService } from './services/active-dirty-manager.service';

const PLUGIN_NAME = 'base-formula-engine';

interface IUniverFormulaEngine {
    notExecuteFormula?: boolean;
    function?: Array<[Ctor<BaseFunction>, IFunctionNames]>;
}

export class UniverFormulaEnginePlugin extends Plugin {
    constructor(
        private _config: IUniverFormulaEngine,
        @Inject(Injector) protected override _injector: Injector
    ) {
        super(PLUGIN_NAME);
    }

    override onStarting(): void {
        this._initialize();
    }

    private _initialize() {
        // worker and main thread
        const dependencies: Dependency[] = [
            // Services
            [IFunctionService, { useClass: FunctionService }],
            [IFeatureCalculationManagerService, { useClass: FeatureCalculationManagerService }],
            [IDefinedNamesService, { useClass: DefinedNamesService }],
            [IActiveDirtyManagerService, { useClass: ActiveDirtyManagerService }],

            // Models
            [FormulaDataModel],

            // Engine
            [LexerTreeBuilder],

            //Controllers
            [
                FormulaController,
                {
                    useFactory: () => this._injector.createInstance(FormulaController, this._config?.function),
                },
            ],
            [SetFeatureCalculationController],
        ];

        if (!this._config?.notExecuteFormula) {
            // only worker
            dependencies.push(
                // Services
                [CalculateFormulaService],
                [IOtherFormulaManagerService, { useClass: OtherFormulaManagerService }],
                [ISuperTableService, { useClass: SuperTableService }],
                [IFormulaCurrentConfigService, { useClass: FormulaCurrentConfigService }],
                [IFormulaRuntimeService, { useClass: FormulaRuntimeService }],

                //Controller
                [CalculateController],
                [SetDefinedNameController],
                [SetOtherFormulaController],
                [SetSuperTableController],
                [RegisterFunctionController],

                // Calculation engine
                [FormulaDependencyGenerator],
                [Interpreter],
                [AstTreeBuilder],
                [Lexer],

                // AstNode factory
                [AstRootNodeFactory],
                [FunctionNodeFactory],
                [LambdaNodeFactory],
                [LambdaParameterNodeFactory],
                [OperatorNodeFactory],
                [PrefixNodeFactory],
                [ReferenceNodeFactory],
                [SuffixNodeFactory],
                [UnionNodeFactory],
                [ValueNodeFactory]
            );
        }

        dependencies.forEach((dependency) => this._injector.add(dependency));
    }

    override onReady(): void {
        this._injector.get(FormulaDataModel).initFormulaData();
    }
}
