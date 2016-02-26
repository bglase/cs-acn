This folder contains custom tests that require special code running in the device, or that are potentially destructive to the device's configuration.
Generally they will not pass with production code, so should not run as part of a standard regression suite.
It may be necessary to factory init the device after running these tests.
