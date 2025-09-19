import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import moment from 'moment';

@ValidatorConstraint({ name: 'isValidDate', async: false })
export class IsValidDateConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return moment(value, 'DD/MM/YYYY', true).isValid();
  }

  defaultMessage() {
    return 'Ngày sinh không hợp lệ, định dạng phải DD/MM/YYYY';
  }
}
