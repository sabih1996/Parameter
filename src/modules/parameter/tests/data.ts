export const mockCreateRequest = (path: string, _value: object = {}) => {
  if (_value !== null && !Object.keys(_value).length) {
    _value = {
      a: {
        string_value: "string_value",
        list_value: {
          values: [
            {
              number_value: 0,
              string_value: "string_value",
              bool_value: false,
            },
          ],
        },
      },
    };
  }

  return {
    parameters: [
      {
        path,
        value: _value,
      },
    ],
  };
};

export const mockCreateResponse = (path: string) => {
  return {
    parameters: [
      {
        path,
        value: {
          a: {
            string_value: "string_value",
            list_value: {
              values: [
                {
                  number_value: 0,
                  string_value: "string_value",
                  bool_value: false,
                },
              ],
            },
          },
        },
      },
    ],
  };
};

export const mockUpdateRequest = (path: string, _value: object = {}) => {
  if (_value !== null) {
    _value = {
      a: {
        string_value: "string_value",
        list_value: {
          values: [
            {
              number_value: 0,
              string_value: "string_value",
              bool_value: false,
            },
          ],
        },
      },
    };
  }

  return {
    parameters: [
      {
        path,
        value: _value,
      },
    ],
  };
};

export const mockUpdateResponse = (path: string) => {
  return {
    parameters: [
      {
        path,
        value: {
          a: {
            string_value: "string_value",
            list_value: {
              values: [
                {
                  number_value: 0,
                  string_value: "string_value",
                  bool_value: false,
                },
              ],
            },
          },
        },
      },
    ],
  };
};

export const mockDeleteRequest = (path: string) => {
  return {
    paths: [path],
  };
};

export const mockRetrieveRequest = (path: string) => {
  return {
    paths: [path],
  };
};
