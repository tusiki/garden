/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ContainerRunAction } from "../../container/moduleConfig.js"
import { runAndCopy } from "../run.js"
import type { KubernetesPluginContext } from "../config.js"
import { storeRunResult } from "../run-results.js"
import { makePodName } from "../util.js"
import { getNamespaceStatus } from "../namespace.js"
import type { RunActionHandler } from "../../../plugin/action-types.js"
import { getDeployedImageId } from "./util.js"
import { runResultToActionState } from "../../../actions/base.js"

export const k8sContainerRun: RunActionHandler<"run", ContainerRunAction> = async (params) => {
  const { ctx, log, action } = params
  const {
    args,
    command,
    cacheResult,
    artifacts,
    env,
    cpu,
    memory,
    volumes,
    privileged,
    addCapabilities,
    dropCapabilities,
  } = action.getSpec()

  const timeout = action.getConfig("timeout")
  const k8sCtx = ctx as KubernetesPluginContext
  const image = getDeployedImageId(action)
  const namespaceStatus = await getNamespaceStatus({ ctx: k8sCtx, log, provider: k8sCtx.provider })

  const runResult = await runAndCopy({
    ...params,
    command,
    args,
    artifacts,
    envVars: env,
    resources: { cpu, memory },
    image,
    namespace: namespaceStatus.namespaceName,
    podName: makePodName("run", action.name),
    timeout,
    volumes,
    privileged,
    addCapabilities,
    dropCapabilities,
  })

  if (cacheResult) {
    await storeRunResult({
      ctx,
      log,
      action,
      result: runResult,
    })
  }

  return {
    state: runResultToActionState(runResult),
    detail: { ...runResult, namespaceStatus },
    outputs: { log: runResult.log },
  }
}
