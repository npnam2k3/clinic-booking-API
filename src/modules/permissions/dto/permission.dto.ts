import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';

export class Permission {
  subject: Subject;
  action: Action;
}
