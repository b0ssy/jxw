set CUR_DIR=%cd%

cd ..
call npm run openapi
cd %CUR_DIR%

rem v1
docker run --rm ^
  -v "%CUR_DIR%":/opt/backend openapitools/openapi-generator-cli generate ^
  --skip-validate-spec ^
  -i /opt/backend/v1/openapi.json ^
  -g typescript-axios ^
  --additional-properties=useSingleRequestParameter=true ^
  -o /opt/backend/.generated/typescript

rem v1 internal
docker run --rm ^
  -v "%CUR_DIR%":/opt/backend openapitools/openapi-generator-cli generate ^
  --skip-validate-spec ^
  -i /opt/backend/v1/openapi-internal.json ^
  -g typescript-axios ^
  --additional-properties=useSingleRequestParameter=true ^
  -o /opt/backend/.generated/internal/typescript

rem Copy to "test"
xcopy /s /y "%CUR_DIR%\.generated\internal\typescript\*.ts" "%CUR_DIR%\..\test\generated"
