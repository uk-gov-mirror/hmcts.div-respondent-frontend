# Divorce Respondent Frontend [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repo is the Frontend App for the 'Acknowledgement of Service' stage of the Divorce process and allows the Respondent to respond to the initial Divorce application.

## Setup

**Config**

For development only config, rename the `config/dev_template.yaml` file to `config/development.yaml`. Running the app with the node environment set to `dev` will ensure this file is used.
This file is not version controlled so any config here will not be pushed to git.

As an example, if you want to use LaunchDarkly locally, place the SDK Key in this file. You can keep the key there as this file is not version controlled.

**Install dependencies:**

```
yarn install
```

**Start application:**


Run the following to start the redis server:

```
docker-compose up
```

Then run the following in separate terminals

```
yarn mocks
```

```
yarn dev
```

The application will now be running on ```https://localhost:3000```.

## Testing

**Unit**

```
yarn test:unit
```

**Validation**

```
yarn test:validation
```

**E2E**

Run the following, each in a separate terminal window
```
yarn dev
yarn mocks
yarn test:e2e
```

**Running tests locally against a PR/AAT**

* Connect to the VPN

* Make a copy of `config/example-local-aat.yml` as `config/local-aat.yml` (which is ignored by git)

* Substitute any secret values in ***local-aat.yml*** from SCM - Do not add/commit secrets to the example file!

* If you want to point to a PR, modify `tests.e2e.url` accordingly.

* Run ```NODE_ENV=aat yarn test:functional```. This would your tests to pick up the new `local-aat.yml`.

## Licensing
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
