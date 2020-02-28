import { Construct, CfnOutput } from "@aws-cdk/core";
import s3 = require("@aws-cdk/aws-s3");
import s3deploy = require("@aws-cdk/aws-s3-deployment");
import {
  OriginAccessIdentity,
  CloudFrontWebDistribution,
  PriceClass,
  ViewerCertificate
} from "@aws-cdk/aws-cloudfront";
import acm = require("@aws-cdk/aws-certificatemanager");
import { PolicyStatement } from "@aws-cdk/aws-iam";
import iam = require("@aws-cdk/aws-iam");

export interface StaticSiteProps {
  source?: {
    path: string;
  };
  bucketProps?: {};
  certificate?: acm.ICertificate;
}

export class StaticSite extends Construct {
  public bucket: s3.Bucket;

  constructor(parent: Construct, name: string, props: StaticSiteProps) {
    super(parent, name);
    console.log(props); // Dummy call to allow props while they're not in use yet

    this.bucket = new s3.Bucket(this, name, props.bucketProps);
    const siteOAI = new OriginAccessIdentity(this, `${name}OAI`);

    let distributionProps = {
      priceClass: PriceClass.PRICE_CLASS_ALL,
      viewerCertificate: ViewerCertificate.fromCloudFrontDefaultCertificate(),
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.bucket,
            originAccessIdentity: siteOAI
          },
          behaviors: [{ isDefaultBehavior: true }]
        }
      ]
    };

    if (props.certificate) {
      distributionProps.viewerCertificate = ViewerCertificate.fromAcmCertificate(
        props.certificate
      );
    }

    const distribution = new CloudFrontWebDistribution(
      this,
      `${name}Dist`,
      distributionProps
    );

    const cloudfrontBucketPolicy = new PolicyStatement();
    cloudfrontBucketPolicy.addActions("s3:GetObject");
    cloudfrontBucketPolicy.addResources(this.bucket.arnForObjects("*"));
    cloudfrontBucketPolicy.effect = iam.Effect.ALLOW;
    cloudfrontBucketPolicy.addCanonicalUserPrincipal(
      siteOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );
    this.bucket.addToResourcePolicy(cloudfrontBucketPolicy);

    if (props.source) {
      new s3deploy.BucketDeployment(this, `${name}Deployment`, {
        sources: [s3deploy.Source.asset(props.source.path)],
        destinationBucket: this.bucket,
        distribution,
        distributionPaths: ["/*"]
      });
    }

    new CfnOutput(this, "URL", {
      value: distribution.domainName
    });
  }
}
