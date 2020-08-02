import { Construct } from "@aws-cdk/core";
import * as cdk from "@aws-cdk/core";
import {
  FunctionProps,
  LayerVersion,
  RuntimeFamily,
  Function,
  Code,
  AssetCode,
} from "@aws-cdk/aws-lambda";
import { existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { checkServerIdentity } from "tls";

export interface PythonFunctionProps extends Omit<FunctionProps, "code"> {
  /**
   * The source code of your Lambda function. You can point to a file in an
   * Amazon Simple Storage Service (Amazon S3) bucket or specify your source
   * code as inline text.
   *
   * Only Asset based code is supported for the PythonFunction class
   */
  readonly code: AssetCode;

  /**
   * The directory to store temporary builds of the modules from your requirements.txt
   *
   * @default - "build/${name}"
   */
  readonly buildDir?: string;
}

export class PythonFunction extends Function {
  public requirementsLayer: LayerVersion;

  constructor(parent: Construct, name: string, props: PythonFunctionProps) {
    const buildDir = props.buildDir || `build/${name}`;

    if (props.runtime.family != RuntimeFamily.PYTHON) {
      throw new TypeError("Only Python language families are supported");
    }

    if (!existsSync("build")) {
      mkdirSync("build");
    }

    if (!existsSync(buildDir)) {
      mkdirSync(buildDir);
    }

    execSync(
      `docker run --rm` +
        ` --volume "$PWD/${props.code.path}:/src"` +
        ` --volume "$PWD/${buildDir}:/build"` +
        ` --workdir "/src"` +
        ` ${props.runtime.bundlingDockerImage.image}` +
        ` pip install --requirement requirements.txt --target "/build/python"`
    );

    const requirementsLayer = new LayerVersion(parent, `${name}Requirements`, {
      code: Code.fromAsset(buildDir),
      compatibleRuntimes: [props.runtime],
    });

    const lambdaProps = {
      ...props,
      layers: [...(props.layers || []), requirementsLayer],
    };

    super(parent, name, lambdaProps);
  }
}
