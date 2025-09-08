// Factory Pattern for service creation
import { DocumentationService, DefaultDocumentationService, DefaultCategoryMapper } from './DocumentationService';
import { FileSystemDocumentationRepository, DefaultFileLoader } from './DocumentationRepository';

export class DocumentationServiceFactory {
  static createDefault(): DocumentationService {
    const fileLoader = new DefaultFileLoader();
    const repository = new FileSystemDocumentationRepository('/docs', fileLoader);
    const categoryMapper = new DefaultCategoryMapper();
    
    return new DefaultDocumentationService(repository, categoryMapper);
  }

  static createWithCustomRepository(repository: any): DocumentationService {
    const categoryMapper = new DefaultCategoryMapper();
    return new DefaultDocumentationService(repository, categoryMapper);
  }

  static createForTesting(mockRepository: any, mockCategoryMapper?: any): DocumentationService {
    const categoryMapper = mockCategoryMapper || new DefaultCategoryMapper();
    return new DefaultDocumentationService(mockRepository, categoryMapper);
  }
}