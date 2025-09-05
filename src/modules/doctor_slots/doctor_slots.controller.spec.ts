import { Test, TestingModule } from '@nestjs/testing';
import { DoctorSlotsController } from './doctor_slots.controller';
import { DoctorSlotsService } from './doctor_slots.service';

describe('DoctorSlotsController', () => {
  let controller: DoctorSlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorSlotsController],
      providers: [DoctorSlotsService],
    }).compile();

    controller = module.get<DoctorSlotsController>(DoctorSlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
