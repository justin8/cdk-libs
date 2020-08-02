# CDK Python Lambda Function

This module provides a self-building Python Lambda module that generates a layer for the dependent packages from your requirements.txt dynamically. It will automatically compile the libraries using the correct version of python as you have specified. Usage is almost identical to a regular lambda except the asset source/build dir is defined automatically using `Code.fromAsset`.

Requirements:

- The source for the Lambda must be in `src/${name}`, where `${name}` is the name used in creation of the CDK construct
- `build/*` must be in git ignore.
- Docker installed and running (it is used to build against the correct Python version)

## Usage

```typescript
new PythonLambda(this, "function1", {
  handler: "index.lambda_handler",
  runtime: lambda.Runtime.PYTHON_3_8,
});
```

With the following file structure:

```
root
|-- src
|   |-- index.py <-- Contains a "lambda_handler" function that is called upon execution by Lambda
|   |-- requirements.txt <-- All of your requirements defined here as usual
|-- build <-- This is in gitignore, doesn't have to exist otherwise; Just contains the layer cache for the required packages
```

From the above:

- Any packages listed in `requirements.txt` will be automatically bundled up in to a layer
- The packages will be installed via the correctly versioned docker container (provided by `lambda.Runtime.*.bundlingDockerImage`)
- The layer will be assigned to the Lambda function that is created
- The output object will be a regular Lambda function
- There is an additional property of `requirementsLayer` on the function if you need to interact with it for some reason
