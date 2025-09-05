import { Test, TestingModule } from '@nestjs/testing';
import { DoctorSlotsService } from './doctor_slots.service';

describe('DoctorSlotsService', () => {
  let service: DoctorSlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorSlotsService],
    }).compile();

    service = module.get<DoctorSlotsService>(DoctorSlotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
