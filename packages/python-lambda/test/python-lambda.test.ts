import {
  expect as expectCDK,
  haveResource,
  SynthUtils,
  haveResourceLike,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { PythonFunction, PythonFunctionProps } from "../lib";

let defaultProps: PythonFunctionProps = {
  runtime: lambda.Runtime.PYTHON_3_8,
  handler: "index.lambda_handler",
  code: lambda.Code.fromAsset("test/src"),
  buildDir: "test/build",
};

const app = new cdk.App();
const stack = new cdk.Stack(app, "stack");
new PythonFunction(stack, "construct", defaultProps);

test("Function is created", () => {
  expectCDK(stack).to(
    haveResourceLike("AWS::Lambda::Function", {
      Handler: "index.lambda_handler",
      Layers: [{ Ref: "constructRequirements5F042E39" }],
      Runtime: "python3.8",
    })
  );
});

test("Layer is created", () => {
  expectCDK(stack).to(
    haveResourceLike("AWS::Lambda::LayerVersion", {
      CompatibleRuntimes: ["python3.8"],
    })
  );
});
