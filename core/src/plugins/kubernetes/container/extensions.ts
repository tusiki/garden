/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DeepPrimitiveMap } from "../../../config/common.js"
import type {
  BuildActionExtension,
  DeployActionExtension,
  RunActionExtension,
  TestActionExtension,
} from "../../../plugin/action-types.js"
import type {
  ContainerBuildAction,
  ContainerDeployAction,
  ContainerRunAction,
  ContainerTestAction,
} from "../../container/config.js"
import type { ContainerBuildMode, KubernetesProvider } from "../config.js"
import { getPortForwardHandler } from "../port-forward.js"
import { k8sGetRunResult } from "../run-results.js"
import { k8sGetTestResult } from "../test-results.js"
import { getBuildkitBuildStatus, buildkitBuildHandler } from "./build/buildkit.js"
import type { BuildStatusHandler, BuildHandler } from "./build/common.js"
import { getKanikoBuildStatus, kanikoBuild } from "./build/kaniko.js"
import { getLocalBuildStatus, localBuild } from "./build/local.js"
import { deleteContainerDeploy, k8sContainerDeploy } from "./deployment.js"
import { execInContainer } from "./exec.js"
import { k8sGetContainerBuildActionOutputs, validateDeploySpec } from "./handlers.js"
import { k8sGetContainerDeployLogs } from "./logs.js"
import { k8sPublishContainerBuild } from "./publish.js"
import { k8sContainerRun } from "./run.js"
import { k8sGetContainerDeployStatus } from "./status.js"
import { k8sContainerGetSyncStatus, k8sContainerStartSync, k8sContainerStopSync } from "./sync.js"
import { k8sContainerTest } from "./test.js"

export const k8sContainerBuildExtension = (): BuildActionExtension<ContainerBuildAction> => ({
  name: "container",
  handlers: {
    async getOutputs({ ctx, action }) {
      const provider = ctx.provider as KubernetesProvider
      // TODO: figure out why this cast is needed here
      return {
        outputs: k8sGetContainerBuildActionOutputs({ action, provider }) as unknown as DeepPrimitiveMap,
      }
    },

    build: async (params) => {
      const { ctx } = params

      const provider = <KubernetesProvider>ctx.provider
      const handler = buildHandlers[provider.config.buildMode]

      return handler(params)
    },

    getStatus: async (params) => {
      const { ctx } = params
      const provider = <KubernetesProvider>ctx.provider

      const handler = buildStatusHandlers[provider.config.buildMode]
      return handler(params)
    },

    publish: k8sPublishContainerBuild,
  },
})

export const k8sContainerDeployExtension = (): DeployActionExtension<ContainerDeployAction> => ({
  name: "container",
  handlers: {
    deploy: k8sContainerDeploy,
    delete: deleteContainerDeploy,
    exec: execInContainer,
    getLogs: k8sGetContainerDeployLogs,
    getPortForward: async (params) => {
      return getPortForwardHandler({ ...params, namespace: undefined })
    },
    getStatus: k8sGetContainerDeployStatus,

    startSync: k8sContainerStartSync,
    stopSync: k8sContainerStopSync,
    getSyncStatus: k8sContainerGetSyncStatus,

    validate: async ({ ctx, action }) => {
      validateDeploySpec(action.name, <KubernetesProvider>ctx.provider, action.getSpec())
      return {}
    },
  },
})

export const k8sContainerRunExtension = (): RunActionExtension<ContainerRunAction> => ({
  name: "container",
  handlers: {
    run: k8sContainerRun,
    getResult: k8sGetRunResult,
  },
})

export const k8sContainerTestExtension = (): TestActionExtension<ContainerTestAction> => ({
  name: "container",
  handlers: {
    run: k8sContainerTest,
    getResult: k8sGetTestResult,
  },
})

const buildStatusHandlers: { [mode in ContainerBuildMode]: BuildStatusHandler } = {
  "local-docker": getLocalBuildStatus,
  "cluster-buildkit": getBuildkitBuildStatus,
  "kaniko": getKanikoBuildStatus,
}

const buildHandlers: { [mode in ContainerBuildMode]: BuildHandler } = {
  "local-docker": localBuild,
  "cluster-buildkit": buildkitBuildHandler,
  "kaniko": kanikoBuild,
}
