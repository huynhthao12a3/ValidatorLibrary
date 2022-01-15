// ----- Có thể dùng đoạn Javascript này cho nhiều form, nhiều trang -----
// Đối tượng `Validator`
function Validator(options) {

     // Lấy la thẻ cha của ô input, có chứa form-message
     function getParent(element, selector) {
          // Khi nào có thẻ cha mới chạy, tránh bị lặp vô hạn -> treo
          while (element.parentElement) { 
               if (element.parentElement.matches(selector)) {
                    return element.parentElement;
               } else {
                    // Gán cho thẻ cha để tiếp tục lặp, nếu không thì chỉ dùng 1 thẻ mà lặp vô hạn
                    element = element.parentElement;
               }
          }
     }

     var selectorRules = {};

     // Hàm thực hiện validate
     function validate(inputElement, rule){
          // var formMessage = inputElement.parentElement.querySelector(options.errorSelector)
          var formMessage = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

          // var errorMessage = rule.test(inputElement.value)
          var errorMessage;

          // Lấy ra các rule của selector
          var rules = selectorRules[rule.selector]
          // Lặp qua từng rule & kiểm tra
          // Nếu có lỗi thì dừng việc kiểm tra
          for (var i = 0; i< rules.length; i++) {
               // Khi input là radio/checkbox thì nó vẫn có value mặc dù không chọn, nên phải chia ra hướng xử lý khác
               switch (inputElement.type) {
                    case 'radio':
                    case 'checkbox':
                         errorMessage = rules[i](formElement.querySelector(rule.selector+':checked'))
                         // console.log(rules[i](formElement.querySelector(rule.selector+':checked')))
                         // console.log(formElement.querySelector(rule.selector+':checked'))
                         // console.log(formElement.querySelector(rule.selector).checked)
                         break;
                    
                    default:
                         errorMessage = rules[i](inputElement.value)
               }
               if(errorMessage) break;
          }

          // Thêm class vào ô input để xuất hiện style lỗi
          if(errorMessage != undefined) {
               formMessage.innerText = errorMessage;
               getParent(inputElement, options.formGroupSelector).classList.add('invalid')
          } else {
               formMessage.innerText = ''
               getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
          }

          return !!errorMessage; // có lỗi sẽ là true(Truthy), ngược lại là false(Falsy). Dựa vào Truthy/Falsy
     }

     // Lấy element của form cần validate
     var formElement = document.querySelector(options.form)

     if(formElement) {
          // Xử lý khi submit form
          formElement.onsubmit = function (e) {
               var isFormValid = true;

               // Bỏ đi hành vi mặc định của form khi submit
               e.preventDefault();

               // Lặp qua từng rule và validate
               options.rules.forEach(function (rule) {
                    var inputElement = document.querySelector(rule.selector)
                    var isValid = validate(inputElement, rule)
                    if(isValid) {
                         isFormValid = false;
                    }
               })

               // Xử lý nếu các ô input đều không có lỗi
               if(isFormValid) {
                    // Trường hợp submit với Javascript
                    if (typeof options.onSubmit === 'function') {

                         var enableInputs = formElement.querySelectorAll('[name]:not(disabled)'); // Lấy ra các ô có thuộc tính 'name' mà không có 'disabled'
               
                         // Array.from() chuyễn đổi sang Array để dùng được các hàm có sẵn cỦa Array
                         var formValues = Array.from(enableInputs).reduce(function (values, input) { 
                              switch (input.type) {
                                   case 'radio' :
                                        if(input.matches(':checked')) {
                                             values[input.name] = input.value;
                                        } 
                                        break;

                                   case 'checkbox':
                                        // Vì muốn lấy toàn bộ value mà checkbox checked nên phải lưu value vào Array
                                        // Kiểm tra nếu không phải là Array thì gán cho nó 1 Array rỗng
                                        if(!Array.isArray(values[input.name])) {
                                             values[input.name] = []
                                        }
                                        // Nếu checkbox checked thì lưu value vào Array vừa được gán ở trên 
                                        if(input.matches(':checked')) {
                                             values[input.name].push(input.value);
                                        } 
                                        break;
                                   
                                        case 'file':
                                             values[input.name] = input.files; // files chứa tất cả thông tin của file vừa được tải lên -> sau này dùng post lên Api, upload ảnh lên server ..v.v.v
                                             break;
                                   default:
                                        values[input.name] = input.value;

                              }
                              
                              return values;
                         }, {})

                         options.onSubmit({formValues})
                    }
                    else {
                         // Trường hợp submit với hành vi mặc định
                         formElement.submit();
                    }
               } 

          }

          // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input ,...)
          options.rules.forEach(function (rule) {
               // Lưu lại các rules cho mỗi input ( - để cùng 1 ô input có thể dùng được nhiều rule - )
               if(Array.isArray(selectorRules[rule.selector])) {
                    selectorRules[rule.selector].push(rule.test)
               } else {
                    selectorRules[rule.selector] = [rule.test];
               }

               var inputElements = document.querySelectorAll(rule.selector)
               // Convert từ NodeList sang Array để dùng các hàm có sẵn của Array
               Array.from(inputElements).forEach(function (inputElement) {
                    if(inputElement) {
                         // Xử lý trường hợp blur khỏi input
                         inputElement.onblur = function () {
                              validate(inputElement, rule)
                         }
     
                         // Xử lý mỗi khi người dùng nhập vào input (khi đang gõ) -> ẩn lỗi đi
                         inputElement.oninput = function () {
                              var formMessage = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                              formMessage.innerText = ''
                              getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                         }

                         // Xử lý khi thay đổi chọn trong Select (chọn trường đầu tiên sẽ báo lỗi ngay vì không có value)
                         // Khỏi phải blur ra ngoài
                         inputElement.onchange = function () {
                              validate(inputElement, rule)
                         }
                    }
               })
               
          })
     }
}

// Định nghĩa rules
// Nguyên tắc của rules
// 1. Khi có lỗi =? Trả ra message lỗi
// 2. Khi hợp lệ => Không trả ra cái gì cả (undefined)
Validator.isRequired = function (selector, message) {
     return {
          selector,
          test: function (value) {
               return value ? undefined : message || 'Vui lòng nhập trường này'
          }
     };
}


Validator.isEmail = function (selector, message) {
     return {
          selector,
          test: function (value) {
               var regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
               return regex.test(value) ? undefined : message || 'Trường này phải là email'
          }
     };
}

Validator.minLength = function (selector, min, message) {
     return {
          selector,
          test: function (value) {
               return value.trim().length >= min ? undefined : message || `Vui lòng nhập mật khẩu lớn hơn ${min} kí tự`
          }
     }
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
     return {
          selector,
          test: function (value) {
               return value.trim() == getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
          }
     }
}