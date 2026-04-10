import * as cdk from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { InfrastructureConfig } from "./infrastructure-config";

export class TimeZoneMateStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    config: InfrastructureConfig,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const amplifyServiceRole = new iam.Role(this, "AmplifyServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess-Amplify"),
      ],
    });

    const amplifyApp = new amplify.CfnApp(this, "TimeZoneMateApp", {
      name: "time-zone-mate",
      platform: "WEB",
      iamServiceRole: amplifyServiceRole.roleArn,
      customRules: [
        // Redirect all non-file requests to index.html (SPA support)
        {
          source:
            "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
          target: "/index.html",
          status: "200",
        },
      ],
    });

    const devoBranch = new amplify.CfnBranch(this, "DevoBranch", {
      appId: amplifyApp.attrAppId,
      branchName: config.devoBranch,
      enableAutoBuild: true,
    });

    const prodBranch = new amplify.CfnBranch(this, "ProdBranch", {
      appId: amplifyApp.attrAppId,
      branchName: config.prodBranch,
      enableAutoBuild: true,
    });

    const domain = new amplify.CfnDomain(this, "TimeZoneMateDomain", {
      appId: amplifyApp.attrAppId,
      domainName: config.domainName,
      subDomainSettings: [
        // prod: root and www
        { branchName: config.prodBranch, prefix: "" },
        { branchName: config.prodBranch, prefix: "www" },
        // devo: subdomain
        { branchName: config.devoBranch, prefix: "devo" },
      ],
    });
    domain.addDependency(devoBranch);
    domain.addDependency(prodBranch);
  }
}
