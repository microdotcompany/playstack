# Installation Guide

## Installing Packages

To install packages specifically for the builder workspace, use the following command from the root client directory:

```bash
npm install <package-name> --workspace=builder
```

For example, to install a package like `lodash`:

```bash
npm install lodash --workspace=builder
```

This will install the package only in the builder workspace and update the builder's package.json accordingly.

## Development Dependencies

To install development dependencies, add the `-D` or `--save-dev` flag:

```bash
npm install <package-name> --workspace=builder -D
```
