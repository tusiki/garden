/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect } from "chai"
import { DEFAULT_BUILD_TIMEOUT_SEC } from "../../../../src/constants.js"
import type { ActionConfig, BaseActionConfig } from "../../../../src/actions/types.js"
import type { NonVersionedActionConfigKey } from "../../../../src/actions/base.js"
import { getActionConfigVersion } from "../../../../src/actions/base.js"

describe("getActionConfigVersion", () => {
  function minimalActionConfig(): ActionConfig {
    return {
      kind: "Build",
      type: "test",
      name: "foo",
      timeout: DEFAULT_BUILD_TIMEOUT_SEC,
      internal: {
        basePath: ".",
      },
      spec: {},
    }
  }

  context("action config version does not change", () => {
    // Helper types for testing non-versioned config fields.
    // The tests won't compile if the NonVersionedActionConfigKey type is modified.
    type TestValuePair<T> = { leftValue: T; rightValue: T }
    type TestMatrix = {
      [key in NonVersionedActionConfigKey]: TestValuePair<BaseActionConfig[key]>
    }

    const testMatrix: TestMatrix = {
      description: { leftValue: "Description 1", rightValue: "Description 2" },
      disabled: { leftValue: true, rightValue: false },
      exclude: { leftValue: ["file1"], rightValue: ["file2"] },
      include: { leftValue: ["file1"], rightValue: ["file2"] },
      internal: { leftValue: { basePath: "./base1" }, rightValue: { basePath: "./base2" } },
      source: { leftValue: { path: "path1" }, rightValue: { path: "path2" } },
    }

    for (const [field, valuePair] of Object.entries(testMatrix)) {
      it(`on ${field} field modification`, () => {
        const config1 = minimalActionConfig()
        config1[field] = valuePair.leftValue
        const version1 = getActionConfigVersion(config1)

        const config2 = minimalActionConfig()
        config2[field] = valuePair.rightValue
        const version2 = getActionConfigVersion(config2)

        expect(version1).to.eql(version2)
      })
    }
  })
})
