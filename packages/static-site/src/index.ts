import { Construct, CfnOutput } from "@aws-cdk/core";
import s3 = require("@aws-cdk/aws-s3");
import s3deploy = require("@aws-cdk/aws-s3-deployment");
import {
  OriginAccessIdentity,
  CloudFrontWebDistribution,
  PriceClass
} from "@aws-cdk/aws-cloudfront";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import iam = require("@aws-cdk/aws-iam");

export interface StaticSiteProps {
  source?: {
    path: string;
  };
  bucketProps?: {};
  //   domainName: string;
  //   siteSubDomain: string;
}

export class StaticSite extends Construct {
  constructor(parent: Construct, name: string, props: StaticSiteProps) {
    super(parent, name);
    console.log(props); // Dummy call to allow props while they're not in use yet

    const siteBucket = new s3.Bucket(this, name, props.bucketProps);
    const siteOAI = new OriginAccessIdentity(this, `${name}OAI`);
    const distribution = new CloudFrontWebDistribution(this, `${name}Dist`, {
      priceClass: PriceClass.PRICE_CLASS_ALL,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: siteOAI
          },
          behaviors: [{ isDefaultBehavior: true }]
        }
      ]
    });

    const cloudfrontBucketPolicy = new PolicyStatement();
    cloudfrontBucketPolicy.addActions("s3:GetObject");
    cloudfrontBucketPolicy.addResources(siteBucket.arnForObjects("*"));
    cloudfrontBucketPolicy.effect = iam.Effect.ALLOW;
    cloudfrontBucketPolicy.addCanonicalUserPrincipal(
      siteOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );
    siteBucket.addToResourcePolicy(cloudfrontBucketPolicy);

    if (props.source) {
      new s3deploy.BucketDeployment(this, `${name}Deployment`, {
        sources: [s3deploy.Source.asset(props.source.path)],
        destinationBucket: siteBucket,
        distribution,
        distributionPaths: ["/*"]
      });
    }

    new CfnOutput(this, "URL", {
      value: distribution.domainName
    });
  }
}
