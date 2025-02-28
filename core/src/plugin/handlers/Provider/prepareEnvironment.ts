/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { PluginActionParamsBase } from "../../base.js"
import { projectActionParamsSchema } from "../../base.js"
import type { EnvironmentStatus } from "./getEnvironmentStatus.js"
import { dedent } from "../../../util/string.js"
import { joi } from "../../../config/common.js"
import { environmentStatusSchema } from "../../../config/status.js"
import type { GenericProviderConfig } from "../../../config/provider.js"

export interface PrepareEnvironmentParams<
  C extends GenericProviderConfig = any,
  T extends EnvironmentStatus = EnvironmentStatus,
> extends PluginActionParamsBase<C> {
  status: T
  force: boolean
}

export interface PrepareEnvironmentResult<O extends {} = any, D extends {} = any> {
  status: EnvironmentStatus<O, D>
}

export const prepareEnvironment = () => ({
  description: dedent`
    Make sure the environment is set up for this plugin. Use this action to do any bootstrapping required
    before deploying services.

    Called ahead of any runtime actions (such as \`deployService\`, and \`testModule\`), unless \`getEnvironmentStatus\` returns \`ready: true\`.
  `,
  paramsSchema: projectActionParamsSchema().keys({
    force: joi.boolean().description("Force re-configuration of the environment."),
    status: environmentStatusSchema(),
  }),
  resultSchema: joi.object().keys({
    status: environmentStatusSchema(),
  }),
})
